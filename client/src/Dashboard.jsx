import React, { useEffect, useState } from 'react'
import io from 'socket.io-client'

const socket = io('http://192.168.212.65:3001');

function convertToDecimal(binary) {  // util function
    return parseInt(binary, 2);
}

// Main Component
const Dashboard = () => {

    const [devices, setDevices] = useState([]); // placed devices
    const [connectedDevices, setConnectedDevices] = useState([]) // devices that are connected
    const [triggeredDevices, setTriggeredDevices] = useState([]); // devices that have triggered an alarm

    const [matrix, setMatrix] = useState(Array(16).fill(null).map(() => Array(16).fill('empty')));

    // Update matrix whenever devices change
    useEffect(() => { 
        updateMatrix(devices, connectedDevices, triggeredDevices);
    }, [devices, connectedDevices, triggeredDevices]);

    // Listen for connection detection events from ESP32
    useEffect(() => {
        socket.on("connectionDetected", (data) => {
            console.log(data.message, "in", data.address);
            const address = convertToDecimal(data.address);
    
            setConnectedDevices(prevConnected => [...prevConnected, address]); 
        });
    
        return () => {
            socket.off("connectionDetected"); // Cleanup listener to prevent memory leaks
        };
    }, [socket]);

    // Listen for connection finish events from ESP32
    useEffect(() => {
        socket.on("connectionFinished", (data) => {
            console.log(data.message, "in", data.address); 
            const address = convertToDecimal(data.address);

            setConnectedDevices(prevConnected => prevConnected.filter(device => device !== address));
        });
    
        return () => {
            socket.off("connectionFinished"); // Cleanup listener to prevent memory leaks
        };
    }, [socket]);

    // Listen for motion detection events from ESP32
    useEffect(() => {
        socket.on("motionDetected", (data) => {
            console.log(data.message, "in", data.address); 
            const address = convertToDecimal(data.address);

            setTriggeredDevices(prevTriggered => [...prevTriggered, address]);
        });
    
        return () => {
            socket.off("motionDetected"); // Cleanup listener to prevent memory leaks
        };
    }, [socket]);

    // Listen for motion finish events from ESP32
    useEffect(() => {
        socket.on("motionFinished", (data) => {
            console.log(data.message, "in", data.address); 
            const address = convertToDecimal(data.address);

            setTriggeredDevices(prevConnected => prevConnected.filter(device => device !== address));
        });
    
        return () => {
            socket.off("motionFinished"); // Cleanup listener to prevent memory leaks
        };
    }, [socket]);

    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         setConnectedDevices([]); // Clears the connected devices every 20 seconds
    //     }, 20000); // 20 seconds
    
    //     return () => clearInterval(interval); // Cleanup interval on component unmount
    // }, []);


    function updateMatrix(devices, connectedDevices, triggeredDevices) {
        console.log("...updating matrix")
        // Create a new matrix copy to avoid mutation
        let newMatrix = Array(16).fill(null).map(() => Array(16).fill('empty')); // Reset matrix to 'empty'
        
        // Update matrix based on device addresses
        devices.forEach(device => {
            const row = Math.floor(device.address / 16);
            const col = device.address % 16;
            newMatrix[row][col] = 'placed';
        });

        if(connectedDevices.length > 0) {
            connectedDevices.forEach(device => {
                const row = Math.floor(device / 16);
                console.log(row)
                const col = device % 16;
                console.log(col)
                newMatrix[row][col] = 'connected';
            })
        }

        if(triggeredDevices.length > 0) {
            triggeredDevices.forEach(device => {
                const row = Math.floor(device / 16);
                const col = device % 16;
                newMatrix[row][col] = 'alarm';
            })
        }

        // Update state with new matrix
        setMatrix(newMatrix);
    }


    return (
        <div className='flex flex-col h-screen justify-between items-center'>
            <header>
                <h1 className='text-4xl'>Wattata pannoth ubt huknwa</h1>
            </header>
            <main>
                <Map matrix={matrix}/>
                <DeviceManager devices={devices} setDevices={setDevices}/>
            </main>
            <footer>
                <p>Thank you for visiting</p>
            </footer>
        </div>
    )
}

export default Dashboard

// Map Component
const Map = ({matrix}) => {

    const getColor = (status) => {
        switch (status) {
            case 'placed':
                return 'gray'
            case 'connected':
                return 'green';
            case 'alarm':
                return 'red';
            case 'empty':
            default:
                return 'transparent';
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 30px)', gridGap: '2px' }}>
            {matrix.map((row, rowIndex) =>
                row.map((status, colIndex) => (
                    <div key={`${rowIndex}-${colIndex}`} style={{ width: '30px', height: '30px', border: '1px solid black', position: 'relative' }}>
                        <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: getColor(status),
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)'
                        }}></div>
                    </div>
                ))
            )}
        </div>
    );
}

// Component to manage addition of Devices
const DeviceManager = ({devices, setDevices}) => {

    const [value, setValue] = useState('');

    function addDevice() {
        if (value.length !== 8) {
            alert('Binary code must be 8 characters long');
            return;
        }

        if (devices.length >= 256) {
            alert('Maximum number of devices reached');
            return;
        }

        const addressInDecimal = convertToDecimal(value); // Convert binary address to decimal value
        if (devices.find(device => device.address === addressInDecimal)) {
            alert('Device already exists');
            return;
        }
        if (addressInDecimal > 255) {
            alert('Invalid binary code');
            return;
        }

        // Create a new array with the new device added
        const newDevices = [...devices, { address: addressInDecimal, status: 'placed' }];
            
        // Update the devices state with the new array
        setDevices(newDevices);
    }

    return (
        <div className='my-4'>
            <div className='flex gap-4 items-center'>
                <input 
                    id="new-device" 
                    value={value} 
                    onChange={(e) => setValue(e.target.value)} 
                    type="text" 
                    maxLength="8" 
                    placeholder="Enter address in binary" 
                    className='border-2 py-1 px-2'
                />
                <button 
                    type='button' 
                    className='border-1 py-1 px-2 bg-amber-600' 
                    onClick={() => addDevice()}
                >
                    Add
                </button>
            </div>
        </div>
    )
}