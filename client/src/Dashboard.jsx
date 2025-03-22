import React, { useEffect, useState } from 'react'
import io from 'socket.io-client'

const socket = io('http://192.168.169.65:3001');

function convertToDecimal(binary) {  // util function
    return parseInt(binary, 10);
}

// Main Component
const Dashboard = () => {

    const [devices, setDevices] = useState([]); // placed devices
    const [connectedDevices, setConnectedDevices] = useState([]) // devices that are connected
    const [triggeredDevices, setTriggeredDevices] = useState([]); // devices that have triggered an alarm

    const [matrix, setMatrix] = useState(Array(4).fill(null).map(() => Array(4).fill('empty')));

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
            <div className="h-screen bg-green-500 flex items-center justify-center"></div>
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
        let newMatrix = Array(4).fill(null).map(() => Array(4).fill('empty')); // Reset matrix to 'empty'
        
        // Update matrix based on device addresses
        devices.forEach(device => {
            const row = Math.floor(device.address / 4);
            const col = device.address % 4;
            newMatrix[row][col] = 'placed';
        });

        if(connectedDevices.length > 0) {
            connectedDevices.forEach(device => {
                const row = Math.floor(device / 4);
                console.log(row)
                const col = device % 4;
                console.log(col)
                newMatrix[row][col] = 'connected';
            })
        }

        if(triggeredDevices.length > 0) {
            triggeredDevices.forEach(device => {
                const row = Math.floor(device / 4);
                const col = device % 4;
                newMatrix[row][col] = 'alarm';
            })
        }

        // Update state with new matrix
        setMatrix(newMatrix);
    }


    return (
<div className="h-screen  flex flex-col bg-gray-200 justify-between items-center">
  <header className="my-8">
    <h1 className="text-4xl font-bold text-gray-900">Smart Human & Animal Detection System</h1>
  </header>

  <main className="flex flex-col items-center w-full">
    {/* Map Section with Background Image */}
    <div 
      className="w-[300px] h-[300px] flex justify-center items-center bg-cover bg-center bg-no-repeat rounded-lg shadow-lg" 
      style={{ backgroundImage: "url('/bg.jpeg')" }} // Update with your actual path
    >
      <Map matrix={matrix} />
    </div>

    {/* Device Manager Section */}
    <DeviceManager devices={devices} setDevices={setDevices} />
  </main>

  {/* Footer Section */}
  <footer className="w-full bg-gray-900 text-white py-6 mt-10">
    <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-6">
      <p className="text-sm">&copy; {new Date().getFullYear()} Smart Detection System. All rights reserved.</p>
      <div className="flex space-x-6 mt-3 md:mt-0">
        <a href="#" className="hover:text-amber-500 transition duration-300">Privacy Policy</a>
        <a href="#" className="hover:text-amber-500 transition duration-300">Terms of Service</a>
        <a href="#" className="hover:text-amber-500 transition duration-300">Contact Us</a>
      </div>
    </div>
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
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 60px)', gridGap: '2px' }}>
            {matrix.map((row, rowIndex) =>
                row.map((status, colIndex) => (
                    <div key={`${rowIndex}-${colIndex}`} style={{ width: '60px', height: '60px', border: '3px solid ', position: 'relative' }} className='rounded-lg' >
                            <div className="absolute inset-0 bg-white opacity-70 rounded-lg"></div>

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
        // if (value.length !== 8) {
        //     alert('Binary code must be 8 characters long');
        //     return;
        // }

        if (devices.length >= 16) {
            alert('Maximum number of devices reached');
            return;
        }

        // const addressInDecimal = convertToDecimal(value); // Convert binary address to decimal value

        const addressInDecimal = value;
        if (devices.find(device => device.address === addressInDecimal)) {
            alert('Device already exists');
            return;
        }
        if (addressInDecimal > 15) {
            alert('Invalid binary code');
            return;
        }

        // Create a new array with the new device added
        const newDevices = [...devices, { address: addressInDecimal, status: 'placed' }];

        fetch(`http://192.168.169.79:80/activate?device=${addressInDecimal}`);
            
        // Update the devices state with the new array
        setDevices(newDevices);
    }

    return (
        <div className='my-4 flex flex-col items-center'>
            <div className='flex gap-4 items-center bg-gray-300 p-4 rounded-lg shadow-md'>
                <input 
                    id="new-device" 
                    value={value} 
                    onChange={(e) => setValue(e.target.value)} 
                    type="text" 
                    maxLength="8" 
                    placeholder="Enter address in binary" 
                    className="border-2 border-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-300 transition-all duration-300 outline-none py-2 px-3 rounded-lg w-64 text-gray-800"
                    />
                <button 
                    type='button' 
                    className="py-2 px-4 bg-gray-900 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300"
                    onClick={() => addDevice()}
                >
                    Add
                </button>
            </div>
        </div>
    )
}