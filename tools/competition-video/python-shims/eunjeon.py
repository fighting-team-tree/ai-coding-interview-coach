import MeCab
from pathlib import Path


class Mecab:
    def __init__(self):
        site_packages_dir = Path(MeCab.__file__).resolve().parent.parent
        mecabrc_path = site_packages_dir / "mecabrc"
        dicdir_path = site_packages_dir / "mecab-ko-dic"
        args = f'-r "{mecabrc_path}" -d "{dicdir_path}"'
        self._tagger = MeCab.Tagger(args)

    def pos(self, text):
        parsed = self._tagger.parse(text or "")
        tokens = []
        for line in parsed.splitlines():
            if not line or line == "EOS" or "\t" not in line:
                continue
            surface, features = line.split("\t", 1)
            tag = features.split(",", 1)[0]
            tokens.append((surface, tag))
        return tokens
