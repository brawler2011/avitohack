.PHONY: all go-gen ts-gen deps clean

.DEFAULT_GOAL := all

SHELL := /usr/bin/env bash
.SHELLFLAGS := -eu -o pipefail -c

GO   ?= go
BUN  ?= bun

OAPI_CODEGEN = github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen

GO_OUT := ../backend/pkg/api
TS_OUT := ../frontend/src/api

deps:
	@command -v "$(GO)"   >/dev/null || { echo "Error: go is not installed";  exit 1; }
	@command -v "$(BUN)"  >/dev/null || { echo "Error: bun is not installed"; exit 1; }

go-gen: deps
	mkdir -p $(GO_OUT)
	(cd ../backend && $(GO) run $(OAPI_CODEGEN) \
		-generate chi-server,models,strict-server,client \
		-package api \
		-o pkg/api/api.gen.go \
		../contracts/openapi.yaml)

ts-gen: deps
	rm -rf $(TS_OUT)
	mkdir -p $(TS_OUT)
	bunx openapi-typescript-codegen --input openapi.yaml --output $(TS_OUT) --client fetch --name Api --useOptions

all: go-gen ts-gen

clean:
	rm -rf $(GO_OUT) $(TS_OUT)
