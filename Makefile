test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter spec \
		--require test/common.js \
		--timeout 12s

check =										\
	if [ -z `which siege` ]; then						\
		echo "please install siege. http://www.joedog.org/siege-home/";	\
		exit 1;								\
	fi

install-bench:
	@$(call check)
	@npm install
	@cd bench; npm install

bench: install-bench
	@./node_modules/.bin/benchmarx \
	  --title "buffet benchmarks (siege html and image)" \
		--runner siege \
		--opts bench/opts.json \
		--path ",hello.txt,folder/Alice-white-rabbit.jpg"

bench-slam: install-bench
	@./node_modules/.bin/benchmarx \
	  --title "buffet benchmarks (slam html file)" \
		--runner slam \
		--opts bench/opts.json

bench-html: install-bench
	@./node_modules/.bin/benchmarx \
	  --title "buffet benchmarks (siege html file)" \
		--runner siege \
		--opts bench/opts.json

.PHONY: test bench bench-slam bench-html