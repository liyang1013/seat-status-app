import { join } from "path";
export interface WinShutdownHandler {
    setMainWindowHandle(handle: Buffer): void;
    insertWndProcHook(callback: () => void): boolean;
    removeWndProcHook(): boolean;
    acquireShutdownBlock(reason: string): boolean;
    releaseShutdownBlock(): boolean;
}

let winShutdownHandler: WinShutdownHandler;



if (process.env.NODE_ENV === 'development') {
    winShutdownHandler = require('../../build/Release/win_shutdown_handler.node');
} else {
    const nativePath = join(process.resourcesPath, 'app.asar.unpacked', 'build', 'Release', 'win_shutdown_handler.node');
    winShutdownHandler = require(nativePath);
}


export { winShutdownHandler };