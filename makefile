PYTHON=python
TOOLS=engine/lib/Load.js/tools
SHELL=sh

all: deps dataDeps testDeps

deps:
	$(PYTHON) $(TOOLS)/generateDeps.py engine/ > engine/deps.json

dataDeps:
	$(PYTHON) $(TOOLS)/generateDeps.py data/ '{"dependencies":["engine/deps.json"]}' > data/deps.json
	
testDeps:
	$(PYTHON) $(TOOLS)/generateDeps.py tests/ '{"dependencies":["engine/deps.json"]}' > tests/deps.json	

clean:
	rm -rf data/deps.json engine/deps.json tests/deps.json doc/*

docs:
	jsdoc -c docgen/jsdoc.json

docsPrivate:
	jsdoc -p -c docgen/jsdoc.json
