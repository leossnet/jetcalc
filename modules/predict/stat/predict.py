import json
from pprint import pprint


with open('ask.json') as data_file:    
    data = json.load(data_file)

pprint(data)

