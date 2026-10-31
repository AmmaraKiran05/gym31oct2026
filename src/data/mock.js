// Sample data for screens not yet backed by the database (Progress, Classes, Profile badges, quotes).
// Dashboard, Library, Live Workout and landing stats load from /api.

export const user = {
  name: 'Alex Rivera',
  firstName: 'Alex',
  initials: 'AR',
  handle: '@alexlifts',
  membership: 'Pulse Elite',
  memberSince: 'March 2024',
  level: 14,
  xp: 2840,
  xpNext: 3500,
  streak: 12,
  bestStreak: 27,
  homeGym: 'PulseFit Downtown',
  stats: { workouts: 186, hours: 214, classes: 42, prs: 19 },
}

export const muscleGroups = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

// Estimated 1RM in kg, by week
export const strengthHistory = [
  { week: 'W1', bench: 82, squat: 110, deadlift: 135 },
  { week: 'W2', bench: 84, squat: 112, deadlift: 138 },
  { week: 'W3', bench: 85, squat: 115, deadlift: 140 },
  { week: 'W4', bench: 85, squat: 118, deadlift: 145 },
  { week: 'W5', bench: 88, squat: 120, deadlift: 147 },
  { week: 'W6', bench: 90, squat: 122, deadlift: 150 },
  { week: 'W7', bench: 89, squat: 125, deadlift: 152 },
  { week: 'W8', bench: 92, squat: 128, deadlift: 155 },
  { week: 'W9', bench: 94, squat: 130, deadlift: 160 },
  { week: 'W10', bench: 95, squat: 132, deadlift: 162 },
  { week: 'W11', bench: 97, squat: 135, deadlift: 165 },
  { week: 'W12', bench: 100, squat: 140, deadlift: 170 },
]

export const lifts = [
  { key: 'bench', label: 'Bench Press' },
  { key: 'squat', label: 'Back Squat' },
  { key: 'deadlift', label: 'Deadlift' },
]

export const personalRecords = [
  { id: 1, lift: 'Deadlift', value: '170 kg', date: 'Oct 21', delta: '+5 kg', tier: 'gold' },
  { id: 2, lift: 'Back Squat', value: '140 kg', date: 'Oct 19', delta: '+5 kg', tier: 'gold' },
  { id: 3, lift: 'Bench Press', value: '100 kg', date: 'Oct 17', delta: '+3 kg', tier: 'gold' },
  { id: 4, lift: 'Pull-Ups', value: '18 reps', date: 'Oct 9', delta: '+2 reps', tier: 'silver' },
  { id: 5, lift: '5 km Run', value: '22:41', date: 'Sep 28', delta: '−0:48', tier: 'silver' },
  { id: 6, lift: 'Plank', value: '3:15', date: 'Sep 14', delta: '+0:20', tier: 'bronze' },
]

export const progressSummary = [
  { label: 'Total volume', value: 412, suffix: 't', delta: '+18%' },
  { label: 'Body weight', value: 78.4, suffix: 'kg', delta: '−2.1 kg', decimals: 1 },
  { label: 'Avg. session', value: 52, suffix: 'min', delta: '+6 min' },
]

export const classTypes = {
  Yoga: { color: '#A78BFA', icon: 'yoga' },
  HIIT: { color: '#F97316', icon: 'hiit' },
  Spin: { color: '#22E4F5', icon: 'spin' },
  Boxing: { color: '#F43F5E', icon: 'boxing' },
}

export const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const classes = [
  { id: 'c1', day: 'Mon', time: '06:30', type: 'HIIT', name: 'Sunrise Burn', coach: 'Maya Chen', duration: 45, intensity: 3, spots: 4, capacity: 20 },
  { id: 'c2', day: 'Mon', time: '12:15', type: 'Yoga', name: 'Lunch Flow', coach: 'Priya Nair', duration: 50, intensity: 1, spots: 9, capacity: 18 },
  { id: 'c3', day: 'Mon', time: '18:30', type: 'Boxing', name: 'Fight Club', coach: 'Jordan Blake', duration: 60, intensity: 3, spots: 0, capacity: 16 },
  { id: 'c4', day: 'Tue', time: '07:00', type: 'Spin', name: 'Rhythm Ride', coach: 'Leo Marques', duration: 45, intensity: 2, spots: 12, capacity: 24 },
  { id: 'c5', day: 'Tue', time: '19:00', type: 'HIIT', name: 'Tabata Thunder', coach: 'Maya Chen', duration: 30, intensity: 3, spots: 2, capacity: 20 },
  { id: 'c6', day: 'Wed', time: '06:30', type: 'Yoga', name: 'Power Vinyasa', coach: 'Priya Nair', duration: 60, intensity: 2, spots: 6, capacity: 18 },
  { id: 'c7', day: 'Wed', time: '17:45', type: 'Spin', name: 'Climb & Sprint', coach: 'Leo Marques', duration: 45, intensity: 3, spots: 1, capacity: 24 },
  { id: 'c8', day: 'Wed', time: '19:30', type: 'Boxing', name: 'Pads & Power', coach: 'Jordan Blake', duration: 50, intensity: 2, spots: 7, capacity: 16 },
  { id: 'c9', day: 'Thu', time: '07:00', type: 'HIIT', name: 'Metcon 30', coach: 'Sam Okafor', duration: 30, intensity: 3, spots: 11, capacity: 20 },
  { id: 'c10', day: 'Thu', time: '18:00', type: 'Yoga', name: 'Yin & Restore', coach: 'Priya Nair', duration: 60, intensity: 1, spots: 14, capacity: 18 },
  { id: 'c11', day: 'Fri', time: '06:45', type: 'Spin', name: 'Friday Climb', coach: 'Leo Marques', duration: 45, intensity: 2, spots: 5, capacity: 24 },
  { id: 'c12', day: 'Fri', time: '18:30', type: 'Boxing', name: 'Friday Fight Night', coach: 'Jordan Blake', duration: 60, intensity: 3, spots: 3, capacity: 16 },
  { id: 'c13', day: 'Sat', time: '09:00', type: 'HIIT', name: 'Weekend Warrior', coach: 'Sam Okafor', duration: 45, intensity: 3, spots: 8, capacity: 24 },
  { id: 'c14', day: 'Sat', time: '10:30', type: 'Yoga', name: 'Slow Flow', coach: 'Priya Nair', duration: 60, intensity: 1, spots: 10, capacity: 18 },
]

export const achievements = [
  { id: 'a1', name: 'Iron Starter', desc: 'Complete your first workout', icon: 'dumbbell', unlocked: true },
  { id: 'a2', name: 'On Fire', desc: '7-day workout streak', icon: 'flame', unlocked: true },
  { id: 'a3', name: 'Century Club', desc: '100 workouts completed', icon: 'trophy', unlocked: true },
  { id: 'a4', name: 'Early Bird', desc: '10 workouts before 7am', icon: 'sunrise', unlocked: true },
  { id: 'a5', name: 'Class Act', desc: 'Attend 25 classes', icon: 'calendar', unlocked: true },
  { id: 'a6', name: 'Time Lord', desc: '200 hours trained', icon: 'timer', unlocked: true },
  { id: 'a7', name: 'Double Bodyweight', desc: 'Deadlift 2× your bodyweight', icon: 'zap', unlocked: true },
  { id: 'a8', name: 'Unbreakable', desc: '30-day workout streak', icon: 'shield', unlocked: false, progress: 0.4 },
  { id: 'a9', name: 'Marathoner', desc: 'Log 42 km of cardio in a month', icon: 'heart', unlocked: false, progress: 0.65 },
]

export const quotes = [
  { text: 'The only bad workout is the one that didn’t happen.', author: 'Unknown' },
  { text: 'Strength doesn’t come from what you can do. It comes from overcoming the things you once thought you couldn’t.', author: 'Rikki Rogers' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Augusta F. Kantra' },
  { text: 'Take care of your body. It’s the only place you have to live.', author: 'Jim Rohn' },
  { text: 'Success isn’t always about greatness. It’s about consistency.', author: 'Dwayne Johnson' },
  { text: 'Don’t count the days. Make the days count.', author: 'Muhammad Ali' },
  { text: 'You don’t have to be extreme, just consistent.', author: 'Unknown' },
]

export function quoteOfTheDay(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((date - start) / 86400000)
  return quotes[dayOfYear % quotes.length]
}
