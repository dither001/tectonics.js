KNAME := $(shell uname)
ifeq (Darwin,$(findstring Darwin,$(KNAME)))
	CPP=g++-8
else
	CPP=/usr/bin/cpp
endif
OUT=postcompiled/Rasters.js postcompiled/Shaders.js postcompiled/Academics.js
SCRIPTS = $(shell find precompiled/ -type f -name '*.js')
SHADERS = $(shell find precompiled/ -type f -name '*.glsl.c')

OUT=postcompiled/utils/Rasters.cpp.js postcompiled/utils/Rasters.js postcompiled/view/FragmentShaders.js postcompiled/view/VertexShaders.js

all: $(OUT)

postcompiled/Rasters.js : precompiled/rasters/Rasters.js $(SCRIPTS) Makefile
run:
	emrun --browser chrome postcompiled/utils/Rasters.cpp.html

postcompiled/utils/Rasters.cpp.js:
	em++ --emrun --bind --profiling-funcs -std=c++11 \
	-g precompiled/utils/cpp/Rasters.cpp \
	-g precompiled/utils/cpp/src/*.cpp \
	-I precompiled/utils/cpp/inc \
	-s WASM=1 -s DEMANGLE_SUPPORT=1 -s ASSERTIONS=1 -s SAFE_HEAP=1 -s EXPORT_NAME="'Rasters'" -s MODULARIZE=1 \
	-o postcompiled/utils/Rasters.cpp.html

postcompiled/utils/Rasters.js : precompiled/utils/Rasters.js
	$(CPP) -E -P -I. -xc -Wundef -std=c99 -nostdinc -Wtrigraphs -fdollars-in-identifiers -C $< > $@

postcompiled/Shaders.js : precompiled/Shaders.js $(SHADERS) Makefile
	$(CPP) -E -P -I. -xc -Wundef -std=c99 -nostdinc -Wtrigraphs -fdollars-in-identifiers -C precompiled/Shaders.js > $@

postcompiled/Academics.js : precompiled/Academics.js $(SHADERS) Makefile
	$(CPP) -E -P -I. -xc -Wundef -std=c99 -nostdinc -Wtrigraphs -fdollars-in-identifiers -C precompiled/Academics.js > $@

clean:
	rm -f $(OUT)
