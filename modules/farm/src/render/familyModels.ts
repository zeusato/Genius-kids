/** Small, shared-geometry villagers. Positions are local to an articulated joint. */
export type FamilyMember = 'father' | 'mother' | 'son' | 'daughter';
export type Joint = 'root' | 'body' | 'head' | 'leftArm' | 'rightArm' | 'leftForearm' | 'rightForearm' | 'leftLeg' | 'rightLeg' | 'leftShin' | 'rightShin';
export type FamilyPart = { shape: 'box' | 'round'; color: string; joint: Joint; p: [number, number, number]; size: [number, number, number]; tilt?: number; tool?: 'handle' | 'axe' | 'pick' };

export function familyParts(member: FamilyMember): FamilyPart[] {
    const child = member === 'son' || member === 'daughter', female = member === 'mother' || member === 'daughter';
    const shirt = { father: '#ede0b6', mother: '#c77561', son: '#6fa8a1', daughter: '#d998a2' }[member];
    const trousers = { father: '#597e89', mother: '#687c69', son: '#bd9660', daughter: '#eee0bd' }[member];
    const skin = '#e8b991', hair = member === 'father' ? '#60452f' : '#49362e', ink = '#332e2a';
    const out: FamilyPart[] = [];
    const part = (shape: FamilyPart['shape'], color: string, joint: Joint, p: FamilyPart['p'], size: FamilyPart['size'], tilt = 0, tool?: FamilyPart['tool']) => out.push({ shape, color, joint, p, size, tilt, tool });
    const round = (color: string, joint: Joint, p: FamilyPart['p'], size: FamilyPart['size'], tilt = 0) => part('round', color, joint, p, size, tilt);
    const box = (color: string, joint: Joint, p: FamilyPart['p'], size: FamilyPart['size'], tilt = 0) => part('box', color, joint, p, size, tilt);

    box(shirt, 'body', [0, .27, 0], [.51, .56, .34]);
    round(skin, 'body', [0, .58, 0], [.105, .12, .1]);
    box(trousers, 'root', [0, .60, 0], [.43, .19, .30]);
    round(skin, 'head', [0, .24, .015], [.275, .305, .25]);
    round(hair, 'head', [0, .415, -.045], [.279, .175, .237]);
    round(hair, 'head', [-.10, .433, .135], [.17, .082, .115], -.2);
    round(skin, 'head', [0, .20, .267], [.039, .044, .037]);
    box('#a46551', 'head', [0, .108, .24], [.065, .014, .016]);
    for (const side of [-1, 1] as const) {
        const arm: Joint = side < 0 ? 'leftArm' : 'rightArm', forearm: Joint = side < 0 ? 'leftForearm' : 'rightForearm';
        const leg: Joint = side < 0 ? 'leftLeg' : 'rightLeg', shin: Joint = side < 0 ? 'leftShin' : 'rightShin';
        round(skin, 'head', [side * .267, .245, 0], [.047, .071, .047]);
        round(ink, 'head', [side * .092, .275, .246], [.027, .037, .018]);
        round('#fff2db', 'head', [side * .092 - .006, .286, .261], [.008, .010, .005]);
        box(hair, 'head', [side * .10, .35, .23], [.063, .013, .021], side * -.1);
        round('#d98d7b', 'head', [side * .162, .178, .215], [.041, .021, .013]);
        round(shirt, arm, [0, -.085, 0], [.116, .16, .139]);
        round(skin, forearm, [0, -.075, 0], [.073, .113, .078]);
        round(skin, forearm, [0, -.174, .015], [.083, .078, .074]);
        box(trousers, leg, [0, -.11, 0], [.183, .265, .225]);
        box(child ? skin : trousers, shin, [0, -.115, 0], [.15, .245, .185]);
        box(member === 'daughter' ? '#9b6b59' : '#77563d', shin, [0, -.238, .055], [.195, .16, .31]);
        box('#4c4738', shin, [0, -.299, .061], [.198, .043, .315]);
        if (member === 'father') {
            box(trousers, 'body', [side * .145, .38, .167], [.067, .37, .04], side * -.07);
            round('#ddb976', 'body', [side * .145, .32, .195], [.022, .022, .012]);
        }
    }
    if (member === 'father') {
        box(trousers, 'body', [0, .14, .177], [.36, .36, .045]);
        box('#486976', 'body', [0, .19, .206], [.145, .113, .02]);
        round('#d9b974', 'head', [0, .52, .025], [.445, .044, .365]);
        round('#d1aa62', 'head', [0, .625, -.014], [.285, .146, .244]);
        round('#997343', 'head', [0, .552, -.005], [.288, .035, .251]);
    }
    if (member === 'mother') {
        round(hair, 'head', [0, .27, -.178], [.272, .265, .111]);
        round(hair, 'head', [0, .39, -.29], [.147, .143, .122]);
        round('#d5b273', 'head', [0, .43, -.28], [.154, .033, .122]);
        box(trousers, 'body', [0, .025, 0], [.57, .32, .375]);
        box('#efe0bb', 'body', [0, .105, .206], [.35, .38, .033]);
        box('#dccba4', 'body', [0, .12, .229], [.16, .115, .02]);
        box('#e6d4b1', 'body', [0, .285, .184], [.51, .057, .035]);
        for (const side of [-1, 1]) box('#ede0be', 'body', [side * .104, .43, .172], [.044, .25, .025], side * .14);
    }
    if (member === 'son') {
        round('#608496', 'head', [0, .48, -.015], [.289, .141, .25]);
        round('#547888', 'head', [0, .444, .229], [.27, .031, .207]);
        box('#eddda9', 'body', [0, .33, .177], [.28, .065, .018]);
        box('#507e7c', 'body', [0, .11, .178], [.14, .11, .02]);
    }
    if (member === 'daughter') {
        box('#c78594', 'body', [0, .025, 0], [.56, .33, .37]);
        box('#e9c580', 'body', [0, .26, .188], [.48, .055, .025]);
        for (const side of [-1, 1]) {
            round(hair, 'head', [side * .27, .27, -.10], [.115, .19, .116], side * -.28);
            round('#ebbf76', 'head', [side * .27, .365, -.08], [.13, .04, .116]);
            round('#f0ca88', 'body', [side * .052, .29, .216], [.053, .037, .022], side * .3);
        }
    }
    if (!child) {
        part('box', '#957046', 'rightForearm', [0, -.17, .28], [.062, .063, .75], 0, 'handle');
        part('box', '#9aadaa', 'rightForearm', [.085, -.17, .61], [.28, .20, .075], -.18, 'axe');
        part('box', '#879b9b', 'rightForearm', [0, -.17, .61], [.55, .074, .085], -.08, 'pick');
    }
    return out;
}
