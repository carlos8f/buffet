test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter spec \
		--timeout 5s

bench:
	@cd bench; npm install
	@./node_modules/.bin/benchmarx \
	  --title "buffet benchmarks (siege html and image)" \
		--runner siege \
		--opts bench/opts.json \
		--path ",hello.txt,folder/Alice-white-rabbit.jpg"

bench-slam:
	@cd bench; npm install
	@./node_modules/.bin/benchmarx \
	  --title "buffet benchmarks (slam html file)" \
		--runner slam \
		--opts bench/opts.json \
		--path /

bench-html:
	@cd bench; npm install
	@./node_modules/.bin/benchmarx \
	  --title "buffet benchmarks (siege html file)" \
		--runner siege \
		--opts bench/opts.json \
		--path /

.PHONY: test bench bench-slam bench-html