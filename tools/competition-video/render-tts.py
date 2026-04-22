from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import numpy as np
import soundfile
import torch
from huggingface_hub import hf_hub_download

os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

from melo import commons
from melo.models import SynthesizerTrn
from melo.split_utils import split_sentence
from melo.text import cleaned_text_to_sequence
from melo.text import korean as korean_text


LANG_TO_HF_REPO_ID = {
    "KR": "myshell-ai/MeloTTS-Korean",
}


class HParams:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            if isinstance(value, dict):
                value = HParams(**value)
            setattr(self, key, value)

    def __getitem__(self, key):
        return getattr(self, key)

    def __setitem__(self, key, value):
        setattr(self, key, value)


def load_hparams(language: str) -> HParams:
    repo_id = LANG_TO_HF_REPO_ID[language]
    config_path = hf_hub_download(repo_id=repo_id, filename="config.json")
    config = json.loads(Path(config_path).read_text(encoding="utf-8"))
    return HParams(**config)


def load_checkpoint(language: str, device: str):
    repo_id = LANG_TO_HF_REPO_ID[language]
    checkpoint_path = hf_hub_download(repo_id=repo_id, filename="checkpoint.pth")
    return torch.load(checkpoint_path, map_location=device)


def to_plain_dict(value):
    if isinstance(value, HParams):
        return {key: to_plain_dict(inner) for key, inner in value.__dict__.items()}
    if isinstance(value, dict):
        return {key: to_plain_dict(inner) for key, inner in value.items()}
    return value


class MeloKoreanTTS:
    def __init__(self, language: str = "KR", device: str = "cpu") -> None:
        self.language = language
        self.device = device
        self.hps = load_hparams(language)
        self.symbol_to_id = {symbol: index for index, symbol in enumerate(self.hps.symbols)}

        self.model = SynthesizerTrn(
            len(self.hps.symbols),
            self.hps.data.filter_length // 2 + 1,
            self.hps.train.segment_size // self.hps.data.hop_length,
            n_speakers=self.hps.data.n_speakers,
            num_tones=self.hps.num_tones,
            num_languages=self.hps.num_languages,
            **self.hps.model.__dict__,
        ).to(device)
        self.model.eval()

        checkpoint = load_checkpoint(language, device)
        self.model.load_state_dict(checkpoint["model"], strict=True)

    def get_text_tensors(self, text: str):
        norm_text = korean_text.text_normalize(text)
        phones, tones, word2ph = korean_text.g2p(norm_text)
        phone_ids, tone_ids, language_ids = cleaned_text_to_sequence(
            phones,
            tones,
            self.language,
            self.symbol_to_id,
        )

        if self.hps.data.add_blank:
            phone_ids = commons.intersperse(phone_ids, 0)
            tone_ids = commons.intersperse(tone_ids, 0)
            language_ids = commons.intersperse(language_ids, 0)
            for index, _ in enumerate(word2ph):
                word2ph[index] *= 2
            word2ph[0] += 1

        if getattr(self.hps.data, "disable_bert", False):
            bert = torch.zeros(1024, len(phone_ids))
            ja_bert = torch.zeros(768, len(phone_ids))
        else:
            bert_features = korean_text.get_bert_feature(norm_text, word2ph, self.device)
            ja_bert = bert_features
            bert = torch.zeros(1024, len(phone_ids))

        return (
            bert,
            ja_bert,
            torch.LongTensor(phone_ids),
            torch.LongTensor(tone_ids),
            torch.LongTensor(language_ids),
        )

    def tts_to_file(self, text: str, speaker_id: int, output_path: str, speed: float) -> None:
        pieces = split_sentence(text, language_str=self.language)
        audio_segments = []

        for piece in pieces:
            bert, ja_bert, phones, tones, language_ids = self.get_text_tensors(piece)
            with torch.no_grad():
                x_tst = phones.to(self.device).unsqueeze(0)
                tones_tst = tones.to(self.device).unsqueeze(0)
                lang_tst = language_ids.to(self.device).unsqueeze(0)
                bert_tst = bert.to(self.device).unsqueeze(0)
                ja_bert_tst = ja_bert.to(self.device).unsqueeze(0)
                x_tst_lengths = torch.LongTensor([phones.size(0)]).to(self.device)
                speakers = torch.LongTensor([speaker_id]).to(self.device)
                audio = self.model.infer(
                    x_tst,
                    x_tst_lengths,
                    speakers,
                    tones_tst,
                    lang_tst,
                    bert_tst,
                    ja_bert_tst,
                    sdp_ratio=0.2,
                    noise_scale=0.6,
                    noise_scale_w=0.8,
                    length_scale=1.0 / speed,
                )[0][0, 0].data.cpu().float().numpy()
            audio_segments.append(audio)

        output_audio = self.concat_audio(audio_segments, self.hps.data.sampling_rate, speed)
        soundfile.write(output_path, output_audio, self.hps.data.sampling_rate)

    @staticmethod
    def concat_audio(segment_data_list, sample_rate: int, speed: float) -> np.ndarray:
        merged = []
        for segment in segment_data_list:
            merged.extend(segment.reshape(-1).tolist())
            merged.extend([0] * int((sample_rate * 0.05) / speed))
        return np.array(merged, dtype=np.float32)


def load_plan(plan_path: Path) -> dict:
    return json.loads(plan_path.read_text(encoding="utf-8"))


def render_plan(plan: dict) -> None:
    language = str(plan.get("language") or "KR")
    speaker_name = str(plan.get("speaker") or language)
    speed = float(plan.get("speed") or 1.0)
    device = str(plan.get("device") or "cpu")

    if language != "KR":
        raise ValueError(f"render-tts.py currently supports Korean only, got: {language}")

    model = MeloKoreanTTS(language=language, device=device)
    speaker_ids = to_plain_dict(model.hps.data.spk2id)
    if speaker_name not in speaker_ids:
        available = ", ".join(sorted(speaker_ids))
        raise KeyError(f"Speaker '{speaker_name}' is not available. Choices: {available}")

    for cue in plan.get("cues", []):
        text = str(cue.get("text") or "").strip()
        if not text:
            continue

        output_path = Path(str(cue["outputPath"]))
        output_path.parent.mkdir(parents=True, exist_ok=True)
        model.tts_to_file(text, speaker_ids[speaker_name], str(output_path), speed=speed)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--plan", required=True)
    args = parser.parse_args()
    render_plan(load_plan(Path(args.plan)))


if __name__ == "__main__":
    main()
