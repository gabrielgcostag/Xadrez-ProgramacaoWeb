const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Nome de usuário é obrigatório'],
        unique: true,
        trim: true,
        minlength: [3, 'Nome de usuário deve ter pelo menos 3 caracteres'],
        maxlength: [20, 'Nome de usuário deve ter no máximo 20 caracteres']
    },
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Email inválido']
    },
    password: {
        type: String,
        required: [true, 'Senha é obrigatória'],
        minlength: [6, 'Senha deve ter pelo menos 6 caracteres']
    },
    nome: {
        type: String,
        trim: true,
        maxlength: [100, 'Nome deve ter no máximo 100 caracteres']
    },
    idade: {
        type: Number,
        min: [0, 'Idade deve ser positiva'],
        max: [150, 'Idade inválida']
    },
    foto: {
        type: String,
        default: null 
    },
    pais: {
        type: String,
        trim: true,
        maxlength: [100, 'País deve ter no máximo 100 caracteres']
    },
    estado: {
        type: String,
        trim: true,
        maxlength: [100, 'Estado deve ter no máximo 100 caracteres']
    },
    cidade: {
        type: String,
        trim: true,
        maxlength: [100, 'Cidade deve ter no máximo 100 caracteres']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: null
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    
    score: {
        type: Number,
        default: 0
    },
    highScore: {
        type: Number,
        default: 0
    },
    wins: {
        type: Number,
        default: 0
    },
    losses: {
        type: Number,
        default: 0
    },
    lastGameDate: {
        type: Date,
        default: null
    }
});
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    
    if (this.score > this.highScore) {
        this.highScore = this.score;
    }
    
    next();
});
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

module.exports = mongoose.model('User', userSchema);
