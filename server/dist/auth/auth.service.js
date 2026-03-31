"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let AuthService = class AuthService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async signUp(email, password) {
        const { data, error } = await this.supabase.getClient().auth.signUp({
            email,
            password,
        });
        if (error)
            throw error;
        return data;
    }
    async signIn(email, password) {
        const { data, error } = await this.supabase.getClient().auth.signInWithPassword({
            email,
            password,
        });
        if (error)
            throw error;
        return data;
    }
    async signInWithGoogle() {
        const { data, error } = await this.supabase.getClient().auth.signInWithOAuth({
            provider: 'google',
        });
        if (error)
            throw error;
        return data;
    }
    async signOut(accessToken) {
        const { error } = await this.supabase.getClient().auth.admin.signOut(accessToken);
        if (error)
            throw error;
    }
    async getUser(accessToken) {
        const { data, error } = await this.supabase.getClient().auth.getUser(accessToken);
        if (error)
            throw error;
        return data.user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AuthService);
//# sourceMappingURL=auth.service.js.map