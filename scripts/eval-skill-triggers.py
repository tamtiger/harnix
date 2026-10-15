#!/usr/bin/env python3
"""
Evaluate skill trigger differentiation using TF-IDF and Cosine Similarity (Python stdlib only).
Detects trigger collisions (cosine similarity >= 0.80) across canonical Harnix skills.
"""

import glob
import math
import os
import re
import sys
from collections import Counter

STOPWORDS = {
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but",
  "by", "can", "did", "do", "does", "doing", "don", "down", "during", "each", "few", "for",
  "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself",
  "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just",
  "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once",
  "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "s", "same", "she",
  "should", "so", "some", "such", "t", "than", "that", "the", "their", "theirs", "them",
  "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too",
  "under", "until", "up", "very", "was", "we", "were", "what", "when", "where", "which",
  "while", "who", "whom", "why", "will", "with", "you", "your", "yours", "yourself", "yourselves",
  "use"
}

def tokenize(text: str) -> list[str]:
  words = re.findall(r"[a-z0-9_-]+", text.lower())
  return [w for w in words if len(w) > 2 and w not in STOPWORDS]

def parse_skill_description(skill_path: str) -> tuple[str, str]:
  with open(skill_path, "r", encoding="utf-8") as f:
    content = f.read()
  name_match = re.search(r"^name:\s*([a-z0-9-]+)", content, re.MULTILINE)
  desc_match = re.search(r"^description:\s*(.+)$", content, re.MULTILINE)
  name = name_match.group(1).strip() if name_match else os.path.basename(os.path.dirname(skill_path))
  desc = desc_match.group(1).strip() if desc_match else ""
  return name, desc

def cosine_similarity(v1: dict[str, float], v2: dict[str, float]) -> float:
  intersection = set(v1.keys()) & set(v2.keys())
  numerator = sum(v1[k] * v2[k] for k in intersection)
  d1 = math.sqrt(sum(val ** 2 for val in v1.values()))
  d2 = math.sqrt(sum(val ** 2 for val in v2.values()))
  if not d1 or not d2:
    return 0.0
  return numerator / (d1 * d2)

def main() -> int:
  skill_files = sorted(glob.glob("src/skills/harnix-*/SKILL.md"))
  if len(skill_files) < 11:
    print(f"Error: expected at least 11 canonical skills, found {len(skill_files)}.", file=sys.stderr)
    return 1

  skills: dict[str, str] = {}
  for sf in skill_files:
    name, desc = parse_skill_description(sf)
    skills[name] = desc

  # Compute TF
  doc_tokens = {name: tokenize(desc) for name, desc in skills.items()}
  doc_freq: Counter[str] = Counter()
  for tokens in doc_tokens.values():
    doc_freq.update(set(tokens))

  num_docs = len(skills)
  tfidf_vectors: dict[str, dict[str, float]] = {}

  for name, tokens in doc_tokens.items():
    tf = Counter(tokens)
    vec: dict[str, float] = {}
    total_tokens = len(tokens) or 1
    for term, count in tf.items():
      idf = math.log((num_docs + 1) / (doc_freq[term] + 1)) + 1
      vec[term] = (count / total_tokens) * idf
    tfidf_vectors[name] = vec

  # Pairwise similarities
  names = list(skills.keys())
  collisions: list[tuple[str, str, float]] = []
  similarities: list[tuple[str, str, float]] = []

  for i in range(len(names)):
    for j in range(i + 1, len(names)):
      s1, s2 = names[i], names[j]
      score = cosine_similarity(tfidf_vectors[s1], tfidf_vectors[s2])
      similarities.append((s1, s2, score))
      if score >= 0.80:
        collisions.append((s1, s2, score))

  print(f"=== Harnix Skill Trigger Differentiation Report ({len(names)} skills) ===")
  similarities.sort(key=lambda x: x[2], reverse=True)
  print("\nTop 5 most similar skill pairs:")
  for s1, s2, score in similarities[:5]:
    print(f"  {s1} <-> {s2}: {score:.3f}")

  if collisions:
    print(f"\n[FAIL] Detected {len(collisions)} trigger collision(s) (similarity >= 0.80):", file=sys.stderr)
    for s1, s2, score in collisions:
      print(f"  COLLISION: {s1} <-> {s2} ({score:.3f})", file=sys.stderr)
    return 1

  print("\n[PASS] All skill trigger descriptions are well-differentiated (max similarity < 0.80).")
  return 0

if __name__ == "__main__":
  sys.exit(main())
