import { use, useEffect, useState } from 'react'
import io from 'socket.io-client'

const socket = io('http://192.168.171.65:3001');

function App() {
  const [message, setMessage] = useState('');
  const [messageReceived, setMessageReceived] = useState('');
  const [room, setRoom] = useState('');

  const joinRoom = () => {
    if (room !== ""){
      socket.emit("join_room", room);
    }
  };
  const sendMessage = () => {
    socket.emit("send_message", {message, room});
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessageReceived(data.message);
    });
  }, [socket]);

  return (
    <>
    <div className='App'>
      <input placeholder='room...' onChange={(e) => setRoom(e.target.value)} />
      <button onClick={joinRoom}>Join Room</button>
      <br />
      <input placeholder='message...'  onChange={(e) => setMessage(e.target.value)} />
      <button onClick={sendMessage}>Send Message</button>
      <h1>Message:</h1>
      <p>{messageReceived}</p>
    </div>  
    </>
  )
}

export default App
