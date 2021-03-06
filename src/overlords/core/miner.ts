import {Overlord} from '../Overlord';
import {MiningSite} from '../../hiveClusters/miningSite';
import {Zerg} from '../../zerg/Zerg';
import {Tasks} from '../../tasks/Tasks';
import {OverlordPriority} from '../../priorities/priorities_overlords';
import {profile} from '../../profiler/decorator';
import {Pathing} from '../../movement/Pathing';
import {DEFCON} from '../../Colony';
import {CreepSetup} from '../CreepSetup';

export const MinerSetup = new CreepSetup('drone', {
	pattern  : [WORK, WORK, CARRY, MOVE],
	sizeLimit: 3,
});

export const MinerLongDistanceSetup = new CreepSetup('drone', {
	pattern  : [WORK, WORK, CARRY, MOVE, MOVE, MOVE],
	sizeLimit: 3,
});


@profile
export class MiningOverlord extends Overlord {

	miners: Zerg[];
	miningSite: MiningSite;
	private allowDropMining: boolean;

	constructor(miningSite: MiningSite, priority: number, allowDropMining = false) {
		super(miningSite, 'mine', priority);
		this.priority += this.outpostIndex * OverlordPriority.remoteRoom.roomIncrement;
		this.miners = this.zerg(MinerSetup.role);
		this.miningSite = miningSite;
		this.allowDropMining = allowDropMining;
	}

	init() {
		let creepSetup = MinerSetup;
		if (this.colony.hatchery && Pathing.distance(this.colony.hatchery.pos, this.pos) > 50 * 3) {
			creepSetup = MinerLongDistanceSetup; // long distance miners
			// todo: this.colony.hatchery is normal hatcher for incubating once spawns[0] != undefined
		}
		let filteredMiners = this.lifetimeFilter(this.miners);
		let miningPowerAssigned = _.sum(_.map(filteredMiners, creep => creep.getActiveBodyparts(WORK)));
		if (miningPowerAssigned < this.miningSite.miningPowerNeeded &&
			filteredMiners.length < _.filter(this.miningSite.pos.neighbors, pos => pos.isWalkable()).length) {
			// Handles edge case at startup of <3 spots near mining site
			this.requestCreep(creepSetup);
		}
		this.creepReport(creepSetup.role, miningPowerAssigned, this.miningSite.miningPowerNeeded);
	}

	private handleMiner(miner: Zerg): void {
		// Ensure you are in the assigned room
		if (miner.room == this.room && !miner.pos.isEdge) {
			// Harvest if out of energy
			if (miner.carry.energy == 0) {
				miner.task = Tasks.harvest(this.miningSite.source);
			}
			// Else see if there is an output to depsit to or to maintain
			else if (this.miningSite.output) {
				if (this.miningSite.output.hits < this.miningSite.output.hitsMax) {
					miner.task = Tasks.repair(this.miningSite.output);
				} else {
					miner.task = Tasks.transfer(this.miningSite.output);
				}
				// Move onto the output container if you're the only miner
				if (!miner.pos.isEqualTo(this.miningSite.output.pos) && this.miners.length == 1 &&
					this.miningSite.output instanceof StructureContainer) {
					miner.goTo(this.miningSite.output, {range: 0});
				}
			}
			// Else build the output if there is a constructionSite (placement handled by miningSite)
			else {
				if (this.miningSite.outputConstructionSite) {
					miner.task = Tasks.build(this.miningSite.outputConstructionSite);
					if (this.miningSite.outputConstructionSite.structureType == STRUCTURE_LINK &&
						miner.pos.isEqualTo(this.miningSite.outputConstructionSite.pos)) {
						// Move off of the contructionSite (link sites won't build)
						miner.moveOffCurrentPos();
					}
				} else if (this.allowDropMining) {
					// Dropmining at early levels
					let nearbyDrops = miner.pos.findInRange(this.room.droppedEnergy, 1);
					let dropPos = nearbyDrops.length > 0 ? _.first(nearbyDrops).pos : miner.pos;
					miner.task = Tasks.drop(dropPos);
				}
			}
		} else {
			// miner.task = Tasks.goTo(this.miningSite);
			miner.goTo(this.miningSite);
		}
	}

	private fleeResponse(miner: Zerg): void {
		if (miner.room == this.colony.room) {
			// If there is a large invasion happening in the colony room, flee
			if (this.colony.defcon > DEFCON.invasionNPC) {
				miner.task = Tasks.flee(this.colony.controller);
			}
		} else {
			// If there are baddies in the room, flee
			if (miner.room.dangerousHostiles.length > 0) {
				miner.task = Tasks.flee(this.colony.controller);
			}
		}
	}

	run() {
		for (let miner of this.miners) {
			if (miner.isIdle) {
				this.handleMiner(miner);
			}
			// this.fleeResponse(miner);
			miner.run();
		}
	}
}
