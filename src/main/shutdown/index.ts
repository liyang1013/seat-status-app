// shutdownHandler.js
const koffi = require('koffi');
const path = require('path');

// 1. 定义Koffi所需的Windows类型和函数签名
const HANDLE = 'void *';
const BOOL = 'bool';
const DWORD = 'uint32';

// Windows API: BOOL WINAPI SetConsoleCtrlHandler(PHANDLER_ROUTINE HandlerRoutine, BOOL Add)
// PHANDLER_ROUTINE 是一个回调函数指针，原型为：BOOL WINAPI HandlerRoutine(DWORD dwCtrlType)
const kernel32 = koffi.load('kernel32.dll'); // 加载系统DLL[citation:5][citation:8]

// 定义控制台事件类型的枚举（部分）
const CTRL_C_EVENT = 0;
const CTRL_SHUTDOWN_EVENT = 6; // 系统关机事件

// 2. 定义你的处理函数（将由Windows调用）
let shutdownCallback: any;

const handlerRoutine = koffi.callback('BOOL (DWORD dwCtrlType)', function (dwCtrlType) {
  console.log(`接收到控制事件: ${dwCtrlType}`);

  if (dwCtrlType === CTRL_SHUTDOWN_EVENT) {
    console.log('检测到系统关机事件！');
    if (shutdownCallback && typeof shutdownCallback === 'function') {
      shutdownCallback(); // 执行你的自定义命令
    }
    // 返回TRUE表示已处理，系统可能会继续关机
    // 返回FALSE会传递给下一个处理程序
    return true;
  }
  // 对于其他事件（如CTRL_C），返回FALSE让系统默认处理
  return false;
});

// 获取SetConsoleCtrlHandler函数
const SetConsoleCtrlHandler = kernel32.func('BOOL SetConsoleCtrlHandler (_In_ void *HandlerRoutine, _In_ BOOL Add)');

// 3. 导出方法来注册/注销关机监听
export const shutdownListener = {
  registerShutdownListener: (callback) => {
    shutdownCallback = callback;
    // Add参数为TRUE表示添加处理程序
    const success = SetConsoleCtrlHandler(handlerRoutine, true);
    if (success) {
      console.log('系统关机监听器注册成功。');
    } else {
      console.error('注册系统关机监听器失败。');
    }
    return success;
  },
  unregisterShutdownListener: () => {
    // Add参数为FALSE表示移除处理程序
    const success = SetConsoleCtrlHandler(handlerRoutine, false);
    shutdownCallback = null;
    koffi.unref(handlerRoutine); // 重要：帮助垃圾回收回调函数
    console.log('系统关机监听器已注销。');
    return success;
  }
};
