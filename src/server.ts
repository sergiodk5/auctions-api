import "module-alias/register";
import app from "@/app";

const PORT = process.env.PORT ?? 3000;

// let server: ReturnType<typeof app.listen>;

// if (require.main === module) {
//     server = app.listen(PORT, () => {
//         console.log(`Server running on ${PORT.toString()}`);
//     });
// }

// export const startServer = () => {
//     server = app.listen(PORT);
//     return server;
// };

// export const stopServer = () => {
//     server.close();
// };

// export default app;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT.toString()}`);
});
