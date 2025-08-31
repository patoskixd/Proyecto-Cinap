import unicodedata
from typing import Optional

def norm(s: Optional[str]) -> str:
    if not s: return ""
    return unicodedata.normalize("NFKD", s).encode("ascii","ignore").decode("ascii").casefold().strip()

def title_matches(query: str, candidate: Optional[str]) -> bool:
    nq, nc = norm(query), norm(candidate)
    return bool(nq) and (nq in nc or nc in nq)

def contains_fragment(fragment: Optional[str], text: Optional[str]) -> bool:
    return True if not fragment else norm(fragment) in norm(text)