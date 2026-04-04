-- V9: Update Kinetic Shadows to enable seats
UPDATE event
SET enable_seats = true
WHERE title = 'Kinetic Shadows';
