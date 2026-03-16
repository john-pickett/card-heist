import { CrewMember } from '../types/crew';

export const crewMembers: CrewMember[] = [
    {
        id: 'knuckles',
        fullName: 'Knuckles Moran',
        nickname: 'Knuckles',
        flavorText: 'Slow and steady wins the race.',
        bio: 'An old-school enforcer who spent twenty years as a vault door installer before switching sides. Nobody reads a lock like a man who built them.',
        effect: 'Show one card from each area.',
        cost: 5000
    },
    {
        id: 'tico',
        fullName: 'Two-Tap Tico',
        nickname: 'Tico',
        flavorText: 'In and out before they know what hit them.',
        bio: 'A former courier for a Lisbon crime syndicate, Tico developed a reputation for delivering — and disappearing — twice as fast as anyone expected. Nobody knows his real name. Nobody\'s asked twice.',
        effect: '+50% Reward from Act One',
        cost: 5000
    },
    {
        id: 'bishop',
        fullName: 'The Bishop',
        nickname: 'Bishop',
        flavorText: 'Every move counts. Make the first one matter.',
        bio: 'Rumored to be a disgraced chess grandmaster turned safecracker, The Bishop never wastes a move. His real name appears in no database, but three unsolved jobs across Vienna all share one signature: a single bishop chess piece left on the empty vault floor.',
        effect: 'First perfect crack pays big.',
        cost: 7500
    },
    {
        id: 'deadlock',
        fullName: 'Deadlock Danny',
        nickname: 'Deadlock',
        flavorText: 'He doesn\'t beat the lock. He convinces it.',
        bio: 'Danny failed out of an engineering PhD after his thesis — a theoretical exploit for commercial vault mechanisms — went missing under mysterious circumstances. The patent that appeared six months later belonged to someone else. Danny found a more direct way to put his research to use.',
        effect: 'Expanded perfect crack zone',
        cost: 7500
    },
    {
        id: 'fingers',
        fullName: 'Fingers McGee',
        nickname: 'Fingers',
        flavorText: 'Luck isn\'t random if you know how to find it.',
        bio: 'Three casinos banned for life. Two charges that mysteriously never stuck. One heist that should have been his last — except somehow it wasn\'t. Fingers has walked away from situations that would make hardened veterans retire. He doesn\'t explain it. He just grins.',
        effect: 'Extremely lucky.',
        cost: 10000
    },
    {
        id: 'jinx',
        fullName: 'Jinx',
        nickname: 'Jinx',
        flavorText: 'Getting caught was always part of the plan.',
        bio: 'Nobody\'s sure if Jinx is the best escape artist alive or just unnaturally comfortable in handcuffs. She\'s been arrested eleven times across six countries and convicted exactly zero. The rumor is she made a deal with someone — the kind of someone you never meet twice.',
        effect: 'If caught in Act Three, you keep 80% of the loot.',
        cost: 7500
    },
];
