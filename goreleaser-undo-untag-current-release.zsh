#!/bin/zsh
echo "Current version: $(svu current)" && \
echo "Next version: $(svu next)" && \
echo "UNTAGGING Current version $(svu current)" && \
# Wait for user input
read -s -k $'?Press any key to continue.\n' && \
## remove current tag on local and remote:
git push origin :refs/tags/$(svu current) && \
git tag -d $(svu current) && \
