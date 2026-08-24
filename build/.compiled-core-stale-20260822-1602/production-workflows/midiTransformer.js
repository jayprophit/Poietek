"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMidiTransformRule = validateMidiTransformRule;
exports.transformMidiNoteMessage = transformMidiNoteMessage;
const clamp = (value, minimum, maximum) => (Math.min(maximum, Math.max(minimum, value)));
function validateMidiMessage(message) {
    if (!Number.isInteger(message.channel) || message.channel < 1 || message.channel > 16) {
        throw new Error('MIDI channel must be an integer from 1 to 16.');
    }
    if (!Number.isInteger(message.note) || message.note < 0 || message.note > 127) {
        throw new Error('MIDI note must be an integer from 0 to 127.');
    }
    if (!Number.isInteger(message.velocity) || message.velocity < 0 || message.velocity > 127) {
        throw new Error('MIDI velocity must be an integer from 0 to 127.');
    }
}
function validateMidiTransformRule(rule) {
    if (!Number.isInteger(rule.transposeSemitones) || Math.abs(rule.transposeSemitones) > 48) {
        throw new Error('Transpose must be an integer from -48 to 48 semitones.');
    }
    if (!Number.isFinite(rule.velocityScale) || rule.velocityScale < 0 || rule.velocityScale > 2) {
        throw new Error('Velocity scale must be from 0 to 2.');
    }
    if (!Number.isInteger(rule.lowNote) || !Number.isInteger(rule.highNote)
        || rule.lowNote < 0 || rule.highNote > 127 || rule.lowNote > rule.highNote) {
        throw new Error('MIDI note filter must be an ordered range from 0 to 127.');
    }
    if (!Number.isInteger(rule.outputChannel) || rule.outputChannel < 1 || rule.outputChannel > 16) {
        throw new Error('Output channel must be an integer from 1 to 16.');
    }
}
function transformMidiNoteMessage(message, rule) {
    validateMidiMessage(message);
    validateMidiTransformRule(rule);
    if (rule.bypass)
        return { kind: 'forward', message: { ...message } };
    if (message.note < rule.lowNote || message.note > rule.highNote) {
        return { kind: 'filtered', reason: 'Note is outside the configured input range.' };
    }
    const note = clamp(message.note + rule.transposeSemitones, 0, 127);
    const velocity = message.type === 'note_off'
        ? message.velocity
        : clamp(Math.round(message.velocity * rule.velocityScale), 1, 127);
    return {
        kind: 'forward',
        message: {
            ...message,
            channel: rule.outputChannel,
            note,
            velocity,
        },
    };
}
