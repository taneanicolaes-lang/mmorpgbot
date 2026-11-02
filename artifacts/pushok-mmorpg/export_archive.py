from __future__ import annotations

from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = ROOT / "generated-artifacts"
OUTPUT_PATH = OUTPUT_DIR / "pushok-mmorpg-source.zip"

SKIP_DIRS = {
    ".agents",
    ".git",
    ".local",
    ".next",
    ".pythonlibs",
    ".venv",
    "__pycache__",
    "coverage",
    "dist",
    "generated-artifacts",
    "node_modules",
    "venv",
}
SKIP_SUFFIXES = {".db", ".log", ".pem", ".p12", ".pfx", ".pyc", ".sqlite", ".sqlite3", ".tsbuildinfo"}


def should_skip(path: Path) -> bool:
    if any(part in SKIP_DIRS for part in path.parts):
        return True
    name = path.name.lower()
    if name == ".env" or (name.startswith(".env.") and name != ".env.example"):
        return True
    if path.suffix.lower() in SKIP_SUFFIXES:
        return True
    if name in {"id_rsa", "id_ed25519", "credentials.json", "secrets.json"}:
        return True
    return False


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if OUTPUT_PATH.exists():
        OUTPUT_PATH.unlink()
    files: list[Path] = []
    with ZipFile(
        OUTPUT_PATH,
        "w",
        compression=ZIP_DEFLATED,
        compresslevel=7,
        strict_timestamps=False,
    ) as archive:
        for path in ROOT.rglob("*"):
            if not path.is_file() or should_skip(path.relative_to(ROOT)):
                continue
            archive.write(path, path.relative_to(ROOT))
            files.append(path)
    size_mb = OUTPUT_PATH.stat().st_size / (1024 * 1024)
    print(f"Архив: {OUTPUT_PATH.relative_to(ROOT)}")
    print(f"Файлов: {len(files)}")
    print(f"Размер: {size_mb:.2f} МБ")


if __name__ == "__main__":
    main()
