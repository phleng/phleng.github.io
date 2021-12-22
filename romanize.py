import sys
import json
from pythainlp.tokenize import clause_tokenize, word_tokenize
from pythainlp.transliterate import romanize

for line in sys.stdin:
    print(json.dumps(list([romanize(word, engine='thai2rom') for word in word_tokenize(line[:-1])])))
    sys.stdout.flush()
