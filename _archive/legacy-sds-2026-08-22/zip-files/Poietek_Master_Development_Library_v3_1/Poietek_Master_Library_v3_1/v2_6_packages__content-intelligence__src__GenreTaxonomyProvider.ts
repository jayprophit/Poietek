export interface GenreEntry {
  id: string;
  name: string;
  source: string;
  aliases: string[];
  parentIds: string[];
  userDefined: boolean;
}

export interface GenreTaxonomyProvider {
  readonly id: string;

  search(query: string): Promise<GenreEntry[]>;
  get(id: string): Promise<GenreEntry | null>;
  listUpdatedSince?(timestamp: string): Promise<GenreEntry[]>;
}

/**
 * MusicBrainz is a suitable open external taxonomy source, but Poietek must
 * preserve user/community-defined genres because genre classification is
 * subjective and evolves over time.
 */
