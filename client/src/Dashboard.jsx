import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { PlusCircle, Trash2 } from "lucide-react";
import MyDraggableComponent from './Moveble';

const serverAddress = "http://192.168.169.79:80";

const socket = io('http://192.168.43.115:3001');

function convertToDecimal(binary) {  
    return parseInt(binary, 10);
}

const Dashboard = () => {
    const [deviceAddress, setDeviceAddress] = useState(""); 
    const [devices, setDevices] = useState([]); 

    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // Load devices from local storage when the component mounts
    useEffect(() => {
        const savedDevices = localStorage.getItem("devices");
        if (savedDevices) {
            setDevices(JSON.parse(savedDevices));
        }
    }, []);

    // Save devices to local storage whenever they change
    useEffect(() => {
        if (devices.length > 0) {
            localStorage.setItem("devices", JSON.stringify(devices));
        }
    }, [devices]);

    // Update container size for draggable elements
    useEffect(() => {
        if (containerRef.current) {
            const updateSize = () => {
                setContainerSize({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            };
            
            updateSize();
            const resizeObserver = new ResizeObserver(updateSize);
            resizeObserver.observe(containerRef.current);
            
            return () => resizeObserver.disconnect();
        }
    }, [devices]);

    useEffect(() => {
        socket.on("connectionDetected", (data) => {
            const address = convertToDecimal(data.address);
            console.log("Connection Detected:", address);
            setDevices(prevDevices =>
                prevDevices.map(device =>
                    device.address === address && device.status !== "trigger"
                        ? { ...device, status: "active" }
                        : device
                )
            );
        });
    
        return () => socket.off("connectionDetected");
    }, []);
    

    useEffect(() => {
        socket.on("connectionFinished", (data) => {
            const address = convertToDecimal(data.address);
            console.log("Connection Finished:", address);
            setDevices(prevDevices =>
                prevDevices.map(device =>
                    device.address === address ? { ...device, status: "lost" } : device
                )
            );
        });

        return () => socket.off("connectionFinished");
    }, []);

    useEffect(() => {
        socket.on("motionDetected", (data) => {
            const address = convertToDecimal(data.address);
            console.log("Motion Detected:", address);
            setDevices(prevDevices =>
                prevDevices.map(device =>
                    device.address === address ? { ...device, status: "trigger" } : device
                )
            );
        });

        return () => socket.off("motionDetected");
    }, []);

    useEffect(() => {
        socket.on("motionFinished", (data) => {
            const address = convertToDecimal(data.address);
            console.log("Motion Finished:", address);
            setDevices(prevDevices =>
                prevDevices.map(device =>
                    device.address === address ? { ...device, status: "active" } : device
                )
            );
        });

        return () => socket.off("motionFinished");
    }, []);

    // Function to add a new device
    const addDevice = () => {
        const address = parseInt(deviceAddress);
        if (!isNaN(address) && address >= 0 && address <= 15) {
            if (devices.some(device => device.address === address)) {
                alert("Device with this address already exists!");
                return;
            }
    
            const newDevice = {
                name: `Device ${address}`,
                address: address,
                status: "lost",
                x: Math.random() * 400,
                y: Math.random() * 400
            };
    
            // Add the new device to state and localStorage
            setDevices(prev => [...prev, newDevice]);
            localStorage.setItem("devices", JSON.stringify([...devices, newDevice]));
    
            // Send the device's address to the server
            fetch(`${serverAddress}/activate?device=${address}`)
                .then(response => response.json())
                .then(data => {
                    console.log("Device activated:", data);
                })
                .catch(error => {
                    console.error("Error activating device:", error);
                });
    
            // Clear the input field
            setDeviceAddress("");
        } else {
            alert("Enter a valid address (0-15).");
        }
    };
    

   // Function to remove a device
    const removeDevice = (address) => {
        const updatedDevices = devices.filter(device => device.address !== address);
        
        // Update the state and localStorage
        setDevices(updatedDevices);
        localStorage.setItem("devices", JSON.stringify(updatedDevices));

        // Send the device's address to the server for removal
        fetch(`${serverAddress}/deactivate?device=${address}`)
            .then(response => response.json())
            .then(data => {
                console.log("Device deactivated:", data);
            })
            .catch(error => {
                console.error("Error deactivating device:", error);
            });
    };


    const handleDrag = (e, data, deviceIndex) => {
        setDevices(prevDevices => {
            const newDevices = [...prevDevices];
            newDevices[deviceIndex] = { ...newDevices[deviceIndex], x: data.x, y: data.y };
            return newDevices;
        });
    };

    return (
        <div className="h-screen flex flex-col bg-[#151f31] justify-between items-center">
            <header className="w-full bg-gray-900 shadow-lg">
                <div className="container mx-auto py-0 px-6 flex justify-center items-center cursor-pointer">
                    <h1 className=" p-4 text-xl font-semibold text-white tracking-wide uppercase transition-transform duration-600 hover:scale-104">
                        SMART HUMAN & ANIMAL DETECTION SYSTEM
                    </h1>
                </div>
            </header>

            <main className="flex h-full">
                {/* Left Section - Add Devices */}
                <div className="w-1/3 flex flex-col items-center bg-[#151f31] p-16 text-white">
                    <h2 className="text-2xl mb-8">Add Your Device</h2>
                    <div className="flex space-x-4 mb-6">
                        <input
                            type="number"
                            placeholder="Enter Address"
                            className="w-34 px-4 py-2 rounded-lg text-white border border-gray-300 focus:border-blue-500 focus:outline-none"
                            value={deviceAddress}
                            onChange={(e) => setDeviceAddress(e.target.value)}
                        />
                        <button 
                            onClick={addDevice} 
                            className="w-36 flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all cursor-pointer"
                        >
                            <PlusCircle size={20} className="mr-2" /> Add Device
                        </button>
                    </div>

                    {/* Device List */}
                    <div className="w-full mt-4">
                        <h3 className="text-lg mb-2">Device List:</h3>
                        <ul className="bg-gray-800 p-4 rounded-lg w-full text-white">
                            {devices.length > 0 ? (
                                devices.map((device, index) => (
                                    <li key={index} className="p-2 border-b border-gray-600 flex justify-between items-center">
                                        <span>{device.name}</span>
                                        <span className={`px-2 rounded-lg text-white ${device.status === 'lost' ? 'bg-yellow-500' : device.status === 'trigger' ? 'bg-red-600' : 'bg-green-500'}`}>
                                            {device.status.toUpperCase()}
                                        </span>
                                        <button onClick={() => removeDevice(device.address)} className="ml-4 text-gray-400 cursor-pointer hover:text-red-500">
                                            <Trash2 size={18} />
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <li className="text-gray-400 text-center py-1">
                                    No devices added yet.
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Right Section - Map */}
                <div className="w-2/3 relative bg-[#151f31]" ref={containerRef}>
                    <img
                        src="/park.jpg" 
                        alt="Smart Detection" 
                        className="w-full h-full object-cover"
                    />

                    {/* Display devices on the image */}
                    {devices.map((device, index) => (
                        <MyDraggableComponent 
                            key={index}
                            sensorNumber={device.address}
                            status={device.status}
                            position={{ x: device.x, y: device.y }}
                            onDrag={(e, data) => handleDrag(e, data, index)}
                            containerSize={containerSize}
                        >
                            <div className={`absolute text-white p-2 rounded-full ${device.status === 'lost' ? 'bg-yellow-500' : device.status === 'triggered' ? 'bg-red-600' : 'bg-green-500'}`}>
                                {device.name}
                            </div>
                        </MyDraggableComponent>
                    ))}
                </div>
            </main>
            
            <footer className="w-full bg-gray-900 text-white py-6 shadow-md">
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-28">
                    <p className="text-sm">&copy; {new Date().getFullYear()} Smart Detection System. All rights reserved.</p>
                    <div className="flex space-x-6 mt-2 md:mt-0">
                        <a href="#" className="text-sm hover:text-orange-500 hover:no-underline">Privacy Policy</a>
                        <a href="#" className="text-sm hover:text-orange-500 hover:no-underline">Terms of Service</a>
                        <a href="#" className="text-sm hover:text-orange-500 hover:no-underline">Support</a>
                    </div>
                    
                </div>
            </footer>
        </div>
    );
};

export default Dashboard;
