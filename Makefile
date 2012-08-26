test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter spec \
		--timeout 5s

bench: install-bench
	@echo "node-static\n-----------"
	@sleep 10
	@cd bench; ./bench.js node-static && echo
	@echo "buffet\n------"
	@sleep 10
	@cd bench; ./bench.js buffet && echo
	@echo "connect\n-------"
	@sleep 10
	@cd bench; ./bench.js connect && echo
	@echo "ecstatic\n--------"
	@sleep 10
	@cd bench; ./bench.js ecstatic && echo
	@echo "paperboy\n--------"
	@sleep 10
	@cd bench; ./bench.js paperboy && echo
	@echo "send\n----"
	@sleep 10
	@cd bench; ./bench.js send && echo

check =										\
	if [ -z `which siege` ]; then						\
		echo "please install siege. http://www.joedog.org/siege-home/";	\
		exit 1;								\
	fi

install-bench:
	@$(call check)
	@cd bench; npm install

.PHONY: test bench