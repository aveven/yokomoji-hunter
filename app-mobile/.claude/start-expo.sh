#!/bin/bash
# Intercept --project-root injected by preview tooling and use it as the working directory
PROJECT_ROOT="/Users/aveimac/Desktop/yokomoji-hunter/app-mobile"
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --project-root) PROJECT_ROOT="$2"; shift 2 ;;
    *) shift ;;
  esac
done
cd "$PROJECT_ROOT"
exec npx expo start --port "${PORT:-8081}"
