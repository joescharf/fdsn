#!/bin/zsh
echo "Current version: $(svu current)" && \
echo "Next version: $(svu next)" && \
echo "Tagging version $(svu next)" && \
# Wait for user input
read -s -k $'?Press any key to continue.\n' && \
git tag $(svu next) && \
git push origin $(svu next) && \
goreleaser release --clean --release-notes release_notes.md && \
