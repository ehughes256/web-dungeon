// Monster factory for creating level-appropriate monsters

class MonsterFactory {
    static monsterTypes = [
        // Original monsters
        {class: Goblin, weight: 4},
        {class: Orc, weight: 2},
        {class: Skeleton, weight: 2},
        {class: Spider, weight: 3},
        {class: PhaseSpider, weight: 1.5},
        {class: BroodMother, weight: 1},
        {class: Troll, weight: 1},
        {class: Bat, weight: 3},
        {class: VampireBat, weight: 2},
        {class: DireBat, weight: 1.5},
        {class: Wizard, weight: 2},
        {class: Minotaur, weight: 1},
        {class: Ghost, weight: 2},

        // Orc hierarchy
        {class: UrukHai, weight: 2},
        {class: OrcBerserker, weight: 2},
        {class: OrcShaman, weight: 1},

        // Goblin hierarchy
        {class: Hobgoblin, weight: 3},
        {class: GoblinArcher, weight: 3},
        {class: GoblinKing, weight: 1}, // Rare

        // Undead hierarchy
        {class: Zombie, weight: 4},
        {class: Wight, weight: 2},
        {class: Lich, weight: 1}, // Rare boss
        {class: Vampire, weight: 1},

        // Dragon hierarchy
        {class: DragonWyrmling, weight: 2},
        {class: YoungDragon, weight: 1},
        {class: AncientDragon, weight: 0.5}, // Very rare boss

        // Demon hierarchy
        {class: Imp, weight: 3},
        {class: Demon, weight: 2},
        {class: DemonLord, weight: 0.5}, // Very rare boss

        // Beast hierarchy
        {class: Wolf, weight: 4},
        {class: DireWolf, weight: 2},
        {class: Werewolf, weight: 1},

        // Elemental hierarchy
        {class: FireElemental, weight: 2},
        {class: IceElemental, weight: 2},
        {class: LightningElemental, weight: 2},

        // Construct hierarchy
        {class: ClayGolem, weight: 2},
        {class: StoneGolem, weight: 1.5},
        {class: IronGolem, weight: 1},

        // Unique monsters
        {class: Basilisk, weight: 1},
        {class: Beholder, weight: 0.5}, // Very rare
        {class: Hydra, weight: 1},
        {class: Manticore, weight: 1.5},

        // Human hierarchy
        {class: Bandit, weight: 3},
        {class: Rogue, weight: 2},
        {class: Knight, weight: 1.5},
        {class: Necromancer, weight: 1},

        // Silly D&D classics
        {class: GelatinousCube, weight: 1.5},
        {class: RustMonster, weight: 2},
        {class: Flumph, weight: 3},
        {class: Mimic, weight: 1.5},
        {class: Owlbear, weight: 2},
        {class: Gazebo, weight: 0.3}, // Rare and pointless
    ];

    static createRandomMonster(id, x, y, currentLevel = 1) {
        // Filter monsters that are appropriate for the current level
        const validMonsters = this.monsterTypes.filter(monsterType => {
            const levelRange = monsterType.class.levelRange;
            if (!levelRange) return true; // If no level range defined, always valid

            // Monster is valid if current level is within its level range
            return currentLevel >= levelRange[0] && currentLevel <= levelRange[1];
        });

        // If no valid monsters found (shouldn't happen), fall back to all monsters
        if (validMonsters.length === 0) {
            validMonsters.push(...this.monsterTypes);
        }

        // Calculate total weight for valid monsters
        const totalWeight = validMonsters.reduce((sum, type) => sum + type.weight, 0);
        let random = Math.random() * totalWeight;

        for (const monsterType of validMonsters) {
            if (random < monsterType.weight) {
                return new monsterType.class(id, x, y);
            }
            random -= monsterType.weight;
        }

        // Fallback to goblin
        return new Goblin(id, x, y);
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {MonsterFactory};
}
