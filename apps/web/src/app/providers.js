'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Providers = Providers;
const react_query_1 = require("@tanstack/react-query");
const react_1 = require("next-auth/react");
const react_2 = require("react");
function Providers({ children }) {
    const [queryClient] = (0, react_2.useState)(() => new react_query_1.QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
            },
        },
    }));
    return (<react_1.SessionProvider>
      <react_query_1.QueryClientProvider client={queryClient}>{children}</react_query_1.QueryClientProvider>
    </react_1.SessionProvider>);
}
