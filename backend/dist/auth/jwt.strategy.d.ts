export type JwtPayload = {
    sub: number;
    email: string;
    iat: number;
    exp: number;
};
declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    validate(payload: JwtPayload): {
        userId: number;
        email: string;
    };
}
export {};
