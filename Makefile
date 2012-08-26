test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter spec \
		--timeout 5s

bench: install-bench
	@node bench

check =										\
	if [ -z `which siege` ]; then						\
		echo "please install siege. http://www.joedog.org/siege-home/";	\
		exit 1;								\
	fi

install-bench:
	@$(call check)
	@cd bench; npm install

.PHONY: test bench