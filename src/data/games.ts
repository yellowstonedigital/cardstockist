// Games the site knows about. `hub: true` means the game has its own
// where-to-buy and releases pages. Turn a game on by setting hub to true.
export interface Game {
  slug: string;
  name: string;
  short: string;
  hub: boolean;
}

export const GAMES: Game[] = [
  { slug: 'pokemon', name: 'Pokémon TCG', short: 'Pokémon', hub: true },
  { slug: 'one-piece', name: 'One Piece Card Game', short: 'One Piece', hub: false },
  { slug: 'magic', name: 'Magic: The Gathering', short: 'Magic', hub: false },
  { slug: 'yugioh', name: 'Yu-Gi-Oh!', short: 'Yu-Gi-Oh!', hub: false },
  { slug: 'lorcana', name: 'Disney Lorcana', short: 'Lorcana', hub: false },
  { slug: 'riftbound', name: 'Riftbound', short: 'Riftbound', hub: false },
  { slug: 'digimon', name: 'Digimon Card Game', short: 'Digimon', hub: false },
  { slug: 'dragon-ball', name: 'Dragon Ball Super Fusion World', short: 'Dragon Ball', hub: false },
  { slug: 'flesh-and-blood', name: 'Flesh and Blood', short: 'Flesh and Blood', hub: false },
  { slug: 'star-wars-unlimited', name: 'Star Wars: Unlimited', short: 'Star Wars', hub: false },
  { slug: 'weiss', name: 'Weiss Schwarz', short: 'Weiss', hub: false },
];

export const gameBySlug = (slug: string) => GAMES.find((g) => g.slug === slug);
export const hubGames = () => GAMES.filter((g) => g.hub);
