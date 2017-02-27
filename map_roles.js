// Prioritized roles map that also acts as spawning instructions for spawner

var rolesMap = {
    // behavior: creep behavior pattern
    // amount: amount to spawn (DEPRECATED)
    miner: {
        behavior: require('role_miner'),
        amount: 0
    },
    hauler: {
        behavior: require('role_hauler'),
        amount: 0
    },
    linker: {
        behavior: require('role_linker'),
        amount: 0
    },
    supplier: {
        behavior: require('role_supplier'),
        amount: 0
    },
    worker: {
        behavior: require('role_worker'),
        amount: 0
    },
    scout: {
        behavior: require('role_scout'),
        amount: 0
    },
    guard: {
        behavior: require('role_guard'),
        amount: 0
    },
    sieger: {
        behavior: require('role_sieger'),
        amount: 0
    },
    rallyHealer: {
        behavior: require('role_rallyHealer'),
        amount: 0
    },
    reserver: {
        behavior: require('role_reserver'),
        amount: 0
    }
};

module.exports = rolesMap;