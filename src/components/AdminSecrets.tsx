import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Save, Trash2 } from 'lucide-react';
import { charactersConfig } from '../configs/characters.config';

interface Secret {
    character_id: string;
    secret: string;
    hint?: string;
}

const AdminSecrets = () => {
    const [secrets, setSecrets] = useState<Record<string, Secret>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSecrets();
    }, []);

    const fetchSecrets = async () => {
        try {
            const { data, error } = await supabase
                .from('character_secrets')
                .select('*');

            if (error) throw error;

            const secretsMap: Record<string, Secret> = {};
            data?.forEach(secret => {
                secretsMap[secret.character_id] = secret;
            });
            setSecrets(secretsMap);
        } catch (err) {
            console.error('Error fetching secrets:', err);
            setError('Failed to load secrets');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateSecret = async (characterId: string, secret: string, hint?: string) => {
        try {
            setIsLoading(true);

            const { error } = await supabase
                .from('character_secrets')
                .upsert({
                    character_id: characterId,
                    secret,
                    hint
                });

            if (error) throw error;
            await fetchSecrets();
        } catch (err) {
            console.error('Error updating secret:', err);
            setError('Failed to update secret');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSecret = async (characterId: string) => {
        try {
            setIsLoading(true);

            const { error } = await supabase
                .from('character_secrets')
                .delete()
                .eq('character_id', characterId);

            if (error) throw error;
            await fetchSecrets();
        } catch (err) {
            console.error('Error deleting secret:', err);
            setError('Failed to delete secret');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-secrets">
            <h2>Character Secrets</h2>

            {error && (
                <div className="error-message m-4">
                    {error}
                    <button onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}

            <div className="grid gap-4 p-4">
                {charactersConfig.map((character) => {
                    const existingSecret = secrets[character.id];

                    return (
                        <div key={character.id} className="character-secret-card">
                            <div className="secret-header">
                                <img
                                    src={character.avatar}
                                    alt={character.name}
                                    className="rounded-full"
                                />
                                <h3>{character.name}</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="secret-input">
                                    <label>Secret Phrase</label>
                                    <input
                                        type="text"
                                        value={existingSecret?.secret || ''}
                                        onChange={(e) => setSecrets({
                                            ...secrets,
                                            [character.id]: {
                                                ...secrets[character.id],
                                                character_id: character.id,
                                                secret: e.target.value
                                            }
                                        })}
                                        placeholder="Enter secret phrase..."
                                    />
                                </div>

                                <div className="secret-input">
                                    <label>Hint (Optional)</label>
                                    <input
                                        type="text"
                                        value={existingSecret?.hint || ''}
                                        onChange={(e) => setSecrets({
                                            ...secrets,
                                            [character.id]: {
                                                ...secrets[character.id],
                                                character_id: character.id,
                                                hint: e.target.value,
                                                secret: secrets[character.id]?.secret || ''
                                            }
                                        })}
                                        placeholder="Enter hint..."
                                    />
                                </div>

                                <div className="secret-actions">
                                    {existingSecret ? (
                                        <>
                                            <button
                                                onClick={() => handleDeleteSecret(character.id)}
                                                className="secret-button delete"
                                                disabled={isLoading}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                            <button
                                                onClick={() => handleUpdateSecret(
                                                    character.id,
                                                    secrets[character.id].secret,
                                                    secrets[character.id].hint
                                                )}
                                                className="secret-button update"
                                                disabled={isLoading}
                                            >
                                                <Save className="w-4 h-4" />
                                                Update
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleUpdateSecret(
                                                character.id,
                                                secrets[character.id]?.secret || '',
                                                secrets[character.id]?.hint
                                            )}
                                            className="secret-button add"
                                            disabled={isLoading || !secrets[character.id]?.secret}
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Secret
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminSecrets;