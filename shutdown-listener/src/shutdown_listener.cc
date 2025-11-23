#include <napi.h>
#include <iostream>

Napi::Boolean StartShutdownListener(const Napi::CallbackInfo& info);
Napi::Boolean StopShutdownListener(const Napi::CallbackInfo& info);

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("startShutdownListener", 
                Napi::Function::New(env, StartShutdownListener));
    exports.Set("stopShutdownListener", 
                Napi::Function::New(env, StopShutdownListener));
    
    std::cout << "Shutdown Listener module initialized" << std::endl;
    return exports;
}

NODE_API_MODULE(shutdown_listener, Init)