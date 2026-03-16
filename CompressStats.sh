#!/usr/bin/env bash
# Compresses Stats files

set -o errtrace
set -o pipefail
set -o nounset
set -o errexit

folder="${1}"
echo "compressing to ${folder}.tar.xz"
tar --checkpoint=.1000 -cJf "/home/marty/usage-stats/${folder}.tar.xz" "/home/marty/usage-stats/Stats/"
