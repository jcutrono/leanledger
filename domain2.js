'use strict';

var VotingType = {
	President: 0,
	National_House: 1,
	National_Senate: 2,
	Local_Governor: 3
}

module.exports.Vote = class Vote {
    constructor(voterId, personId, voteType) {
        this.voterId = voterId;
        this.personId = personId;
        this.voteType = voteType;
    }
}