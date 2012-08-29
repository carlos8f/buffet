test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter spec \
		--timeout 5s

bench:
	@cd bench; npm install
	@./node_modules/.bin/benchmarx \
	  --title "buffet benchmarks" \
		--runner siege \
		--opts bench/opts.json \
		--path ",hello.txt,folder/Alice-white-rabbit.jpg"

.PHONY: test bench