import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '../lib/supabase';
import { Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';

const ADMIN_WALLETS = [
    // Add your admin wallet addresses here
    "J5mLBezP8VrdxPbzKqtfo8m98wXYt4sxFkFJawPKkdsc"
];

interface NewCharacter {
    name: string;
    description: string;
}

const AdminCharacters = () => {
    const { connected, publicKey } = useWallet();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [characters, setCharacters] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [newCharacter, setNewCharacter] = useState<NewCharacter>({
        name: '',
        description: ''
    });

    useEffect(() => {
        if (connected && publicKey) {
            setIsAdmin(ADMIN_WALLETS.includes(publicKey.toString()));
        } else {
            setIsAdmin(false);
        }
    }, [connected, publicKey]);

    useEffect(() => {
        fetchCharacters();

        const subscription = supabase
            .channel('proposed_characters_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'proposed_characters' },
                fetchCharacters)
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchCharacters = async () => {
        try {
            setIsLoading(true);
            const { data, error: fetchError } = await supabase
                .from('proposed_characters')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setCharacters(data || []);
        } catch (err) {
            console.error('Error fetching characters:', err);
            setError('Failed to load characters');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdmin) return;

        try {
            setIsLoading(true);
            const { error: insertError } = await supabase
                .from('proposed_characters')
                .insert([newCharacter]);

            if (insertError) throw insertError;

            setNewCharacter({ name: '', description: '' });
            await fetchCharacters();
        } catch (err) {
            console.error('Error adding character:', err);
            setError('Failed to add character');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!isAdmin) return;

        try {
            setIsLoading(true);
            const { error: deleteError } = await supabase
                .from('proposed_characters')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            await fetchCharacters();
        } catch (err) {
            console.error('Error deleting character:', err);
            setError('Failed to delete character');
        } finally {
            setIsLoading(false);
        }
    };

    if (!connected || !isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Admin Access Required
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        Please connect with an admin wallet to access this page.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Manage Proposed Characters
                    </h1>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg text-center">
                        {error}
                    </div>
                )}

                {/* Add New Character Form */}
                <form onSubmit={handleSubmit} className="mb-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Name
                            </label>
                            <input
                                type="text"
                                value={newCharacter.name}
                                onChange={(e) => setNewCharacter(prev => ({ ...prev, name: e.target.value }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Description
                            </label>
                            <textarea
                                value={newCharacter.description}
                                onChange={(e) => setNewCharacter(prev => ({ ...prev, description: e.target.value }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                rows={3}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <Plus className="w-5 h-5 mr-2" />
                            )}
                            Add Character
                        </button>
                    </div>
                </form>

                {/* Characters List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {characters.map((character) => (
                        <div
                            key={character.id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {character.name}
                                    </h3>
                                    <button
                                        onClick={() => handleDelete(character.id)}
                                        className="text-red-500 hover:text-red-700 transition-colors duration-200"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    {character.description}
                                </p>
                                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                    Votes: {character.votes}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminCharacters;