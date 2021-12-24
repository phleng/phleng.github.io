import sys
import json
import re
from pythainlp.tokenize import clause_tokenize, word_tokenize
from pythainlp.transliterate import romanize

re_is_thai = re.compile('[\u0E00-\u0E7F]')

for line in sys.stdin:
    print(json.dumps(list([romanize(word, engine='thai2rom') if re_is_thai.match(word) else word for word in word_tokenize(line[:-1])])))
    sys.stdout.flush()
