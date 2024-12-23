// src/pages/Admin.tsx

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '../lib/supabase';
import { Loader2, Plus, Trash2, AlertCircle, Calendar, Clock, Users } from 'lucide-react';
import '../styles/admin.css';

// List of admin wallet addresses
const ADMIN_WALLETS = [
    // Add your admin wallet addresses here
    "J5mLBezP8VrdxPbzKqtfo8m98wXYt4sxFkFJawPKkdsc"
];

interface Character {
    id: string;
    name: string;
    description: string;
    votes: number;
    created_at: string;
}

interface VotingPeriod {
    id: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

interface NewCharacter {
    name: string;
    description: string;
}

const AdminPage = () => {
    const { connected, publicKey } = useWallet();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Character states
    const [characters, setCharacters] = useState<Character[]>([]);
    const [newCharacter, setNewCharacter] = useState<NewCharacter>({
        name: '',
        description: ''
    });

    // Voting period states
    const [votingPeriod, setVotingPeriod] = useState<VotingPeriod | null>(null);
    const [newEndDate, setNewEndDate] = useState('');
    const [newEndTime, setNewEndTime] = useState('');
    const [totalVotes, setTotalVotes] = useState(0);

    useEffect(() => {
        if (connected && publicKey) {
            setIsAdmin(ADMIN_WALLETS.includes(publicKey.toString()));
        } else {
            setIsAdmin(false);
        }
    }, [connected, publicKey]);

    useEffect(() => {
        if (isAdmin) {
            fetchData();
        }
    }, [isAdmin]);

    const fetchData = async () => {
        try {
            setIsLoading(true);

            // Fetch characters
            const { data: charactersData, error: charactersError } = await supabase
                .from('proposed_characters')
                .select('*')
                .order('votes', { ascending: false });

            if (charactersError) throw charactersError;
            setCharacters(charactersData || []);

            // Fetch current voting period
            const { data: periodData, error: periodError } = await supabase
                .from('voting_periods')
                .select('*')
                .eq('is_active', true)
                .single();

            if (!periodError && periodData) {
                setVotingPeriod(periodData);
                const endDate = new Date(periodData.end_date);
                setNewEndDate(endDate.toISOString().split('T')[0]);
                setNewEndTime(endDate.toTimeString().slice(0, 5));
            }

            // Calculate total votes
            const totalVotes = charactersData?.reduce((sum, char) => sum + char.votes, 0) || 0;
            setTotalVotes(totalVotes);

        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCharacter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdmin) return;

        try {
            setIsLoading(true);
            const { error: insertError } = await supabase
                .from('proposed_characters')
                .insert([newCharacter]);

            if (insertError) throw insertError;

            setNewCharacter({ name: '', description: '' });
            await fetchData();
        } catch (err) {
            console.error('Error adding character:', err);
            setError('Failed to add character');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCharacter = async (id: string) => {
        if (!isAdmin) return;

        const confirmDelete = window.confirm('Are you sure you want to delete this character?');
        if (!confirmDelete) return;

        try {
            setIsLoading(true);
            const { error: deleteError } = await supabase
                .from('proposed_characters')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            await fetchData();
        } catch (err) {
            console.error('Error deleting character:', err);
            setError('Failed to delete character');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateDeadline = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdmin) return;

        const combinedDateTime = new Date(`${newEndDate}T${newEndTime}`);

        try {
            setIsLoading(true);

            // If there's an existing period, deactivate it
            if (votingPeriod) {
                await supabase
                    .from('voting_periods')
                    .update({ is_active: false })
                    .eq('id', votingPeriod.id);
            }

            // Create new voting period
            const { error } = await supabase
                .from('voting_periods')
                .insert({
                    start_date: new Date().toISOString(),
                    end_date: combinedDateTime.toISOString(),
                    is_active: true
                });

            if (error) throw error;
            await fetchData();
        } catch (err) {
            console.error('Error updating deadline:', err);
            setError('Failed to update deadline');
        } finally {
            setIsLoading(false);
        }
    };

    if (!connected || !isAdmin) {
        return (
            <div className="admin-container">
                <div className="access-denied">
                    <AlertCircle className="icon" />
                    <h2>Admin Access Required</h2>
                    <p>Please connect with an admin wallet to access this page.</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="admin-container">
                <div className="loading">
                    <Loader2 className="icon spin" />
                    <p>Loading admin panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>Admin Dashboard</h1>
                <div className="stats-row">
                    <div className="stat-card">
                        <Users className="stat-icon" />
                        <div>
                            <h3>Total Characters</h3>
                            <p>{characters.length}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <Clock className="stat-icon" />
                        <div>
                            <h3>Total Votes</h3>
                            <p>{totalVotes}</p>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}

            <div className="admin-grid">
                {/* Character Management Section */}
                <section className="admin-section">
                    <h2>Character Management</h2>
                    <form onSubmit={handleAddCharacter} className="add-form">
                        <div className="form-group">
                            <label>Character Name</label>
                            <input
                                type="text"
                                value={newCharacter.name}
                                onChange={(e) => setNewCharacter(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter character name"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={newCharacter.description}
                                onChange={(e) => setNewCharacter(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter character description"
                                rows={3}
                                required
                            />
                        </div>
                        <button type="submit" className="add-button">
                            <Plus className="icon" />
                            Add Character
                        </button>
                    </form>

                    <div className="characters-list">
                        {characters.map((character) => (
                            <div key={character.id} className="character-card">
                                <div className="character-info">
                                    <h3>{character.name}</h3>
                                    <p>{character.description}</p>
                                    <div className="character-stats">
                                        <span className="votes">
                                            {character.votes} votes
                                        </span>
                                        <span className="percentage">
                                            {totalVotes > 0
                                                ? `${((character.votes / totalVotes) * 100).toFixed(1)}%`
                                                : '0%'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteCharacter(character.id)}
                                    className="delete-button"
                                    aria-label="Delete character"
                                >
                                    <Trash2 className="icon" size={20} color="#EF4444" />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Voting Period Management Section */}
                <section className="admin-section">
                    <h2>Voting Period Management</h2>

                    {votingPeriod && (
                        <div className="current-period">
                            <h3>Current Voting Period</h3>
                            <div className="period-info">
                                <Calendar className="icon" />
                                <div>
                                    <p>Started: {new Date(votingPeriod.start_date).toLocaleString()}</p>
                                    <p>Ends: {new Date(votingPeriod.end_date).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleUpdateDeadline} className="deadline-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    value={newEndDate}
                                    onChange={(e) => setNewEndDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>End Time</label>
                                <input
                                    type="time"
                                    value={newEndTime}
                                    onChange={(e) => setNewEndTime(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="update-button">
                            <Clock className="icon" />
                            Update Voting Period
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
};

export default AdminPage;
