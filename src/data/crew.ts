import { CrewMember } from '../types/crew';

export const crewMembers: CrewMember[] = [
    {
        id: 'knuckles',
        fullName: 'Knuckles Moran',
        nickname: 'Knuckles',
        flavorText: 'Inside information is the best kind.',
        bio: 'An old-school enforcer who spent twenty years as a vault door installer before switching sides. Nobody reads a lock like a man who built them.',
        effect: 'He always seems to notice what others miss before the job even starts.',
        cost: __DEV__ ? 1 : 5000,
        imageSource: require('../../assets/images/crew/knuckles.png')
    },
    {
        id: 'tico',
        fullName: 'Two-Tap Tico',
        nickname: 'Tico',
        flavorText: 'In and out before they know what hit them.',
        bio: 'A former courier for a Lisbon crime syndicate, Tico developed a reputation for delivering — and disappearing — twice as fast as anyone expected. Nobody knows her real name. Nobody\'s asked twice.',
        effect: 'When the opening move clicks, the payoff tends to be bigger than expected.',
        cost: __DEV__ ? 1 : 5000,
        imageSource: require('../../assets/images/crew/tico.png')
    },
    {
        id: 'bishop',
        fullName: 'The Bishop',
        nickname: 'Bishop',
        flavorText: 'Every move counts. Make the first one matter.',
        bio: 'Rumored to be a disgraced chess grandmaster turned safecracker, The Bishop never wastes a move. His real name appears in no database, but three unsolved jobs across Vienna all share one signature: a single bishop chess piece left on the empty vault floor.',
        effect: 'If the first real break goes clean, Bishop has a way of turning momentum into profit.',
        cost: __DEV__ ? 1 : 7500,
        imageSource: require('../../assets/images/crew/bishop.png')
    },
    {
        id: 'deadlock',
        fullName: 'Deadlock Danny',
        nickname: 'Deadlock',
        flavorText: 'He doesn\'t beat the lock. He convinces it.',
        bio: 'Danny failed out of an engineering PhD after his thesis — a theoretical exploit for commercial vault mechanisms — went missing under mysterious circumstances. The patent that appeared six months later belonged to someone else. Danny found a more direct way to put his research to use.',
        effect: 'Locks tend to give him more room for error than they should.',
        cost: __DEV__ ? 1 : 7500,
        imageSource: require('../../assets/images/crew/danny.png')
    },
    {
        id: 'fingers',
        fullName: 'Fingers McGee',
        nickname: 'Fingers',
        flavorText: 'Luck isn\'t random if you know how to find it.',
        bio: 'Banned for life from at least three casinos. Two charges that mysteriously never stuck. One heist that should have been his last — except somehow it wasn\'t. Fingers has walked away from situations that would make hardened veterans retire. He doesn\'t explain it. He just grins.',
        effect: 'Extremely lucky. Extremely.',
        cost: __DEV__ ? 1 : 10000,
        imageSource: require('../../assets/images/crew/fingers.png')
    },
    {
        id: 'jinx',
        fullName: 'Jinx',
        nickname: 'Jinx',
        flavorText: 'Getting caught was always part of the plan.',
        bio: 'Nobody\'s sure if Jinx is the best escape artist alive or just unnaturally comfortable in handcuffs. She\'s been arrested eleven times across six countries and convicted exactly zero. The rumor is she made a deal with someone — the kind of someone you never meet twice.',
        effect: 'Even when everything goes wrong at the end, Jinx rarely walks away empty-handed.',
        cost: __DEV__ ? 1 : 7500,
        imageSource: require('../../assets/images/crew/jinx.png')
    },
];
