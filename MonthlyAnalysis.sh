#!/usr/bin/env bash
# Running this by itself assumes at least some logs have been processed
#
# Usage:
#   ./MonthlyAnalysis.sh              outputs Stats for all cutoffs
#   ./MonthlyAnalysis.sh --partial    only 1630/1695 files

partial=false
if [[ "$1" == "--partial" ]]; then
	partial=true
fi

rm -r Stats
mkdir Stats
mkdir Stats/moveset

function process {
	tier=$1
	if [[ $tier == "moveset" ]]; then
		return
	fi

	echo "Processing "$tier >> log.log

	if [[ $tier == "gen9ou" ]] || [[ $tier == "gen9doublesou" ]] || [[ $tier == "gen9randombattle" ]] || [[ $tier == 'gen9oususpecttest' ]] || [[ $tier == "gen9doublesoususpecttest" ]]; then
		node dist/StatCounter.js $tier 1695 &&
		node dist/batchMovesetCounter.js $tier 1695 > Stats/moveset/$tier-1695.txt
	else
		node dist/StatCounter.js $tier 1630 &&
		node dist/batchMovesetCounter.js $tier 1630 > Stats/moveset/$tier-1630.txt
	fi
}
export -f process

function nextprocess {
	tier=$1
	if [[ $tier == "moveset" ]]; then
		return
	fi

	echo "Processing "$tier >> log.log

	if [[ $tier == "gen9ou" ]] || [[ $tier == "gen9doublesou" ]] || [[ $tier == "gen9randombattle" ]] || [[ $tier == 'gen9oususpecttest' ]] || [[ $tier == "gen9doublesoususpecttest" ]]; then
		node dist/StatCounter.js $tier 1825 &&
		node dist/batchMovesetCounter.js $tier 1825 > Stats/moveset/$tier-1825.txt
	else
		node dist/StatCounter.js $tier 1760 &&
		node dist/batchMovesetCounter.js $tier 1760 > Stats/moveset/$tier-1760.txt
	fi

	node dist/StatCounter.js $tier 0 &&
	node dist/batchMovesetCounter.js $tier 0 > Stats/moveset/$tier-0.txt

	node dist/StatCounter.js $tier 1500 &&
	node dist/batchMovesetCounter.js $tier 1500 > Stats/moveset/$tier-1500.txt
}
export -f nextprocess

function monotype {
	tag=$1
	tier=gen9monotype

	echo "Processing "$tag >> log.log

	node dist/StatCounter.js $tier 1630 $tag &&
	node dist/batchMovesetCounter.js $tier 1630 $tag > Stats/moveset/$tier-$tag-1630.txt

	node dist/StatCounter.js $tier 1760 $tag &&
	node dist/batchMovesetCounter.js $tier 1760 $tag > Stats/moveset/$tier-$tag-1760.txt

	node dist/StatCounter.js $tier 0 $tag &&
	node dist/batchMovesetCounter.js $tier 0 $tag > Stats/moveset/$tier-$tag-0.txt

	node dist/StatCounter.js $tier 1500 $tag &&
	node dist/batchMovesetCounter.js $tier 1500 $tag > Stats/moveset/$tier-$tag-1500.txt
}
export -f monotype

ls -S Raw/ | parallel -j 5 process

if [[ "$partial" == false ]]; then
	ls -S Raw/ | parallel -j 5 nextprocess

	parallel -j 5 monotype ::: mononormal monofighting monoflying monopoison monoground monorock monobug monoghost monosteel monofire monowater monograss monoelectric monopsychic monoice monodragon monodark monofairy
	mkdir Stats/monotype
	mv Stats/gen9monotype-mono* Stats/monotype/.
	mkdir Stats/monotype/matchupcharts
	mv Stats/gen9monotype-matchup* Stats/monotype/matchupcharts/.
	mv Stats/gen9nationaldexmonotype-matchup* Stats/monotype/matchupcharts/.
	for d in chaos leads metagame moveset
	do
		mkdir Stats/monotype/$d
		mv Stats/$d/gen9monotype-mono* Stats/monotype/$d/.
	done
fi
