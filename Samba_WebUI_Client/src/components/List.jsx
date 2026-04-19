import React from 'react';
import { IoMdDownload } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { API_BASE_URL } from '../APIs/APIBaseUrl';
const List = ({ file, index }) => {

    const handleDelete = async (name, directoryCheck) => {
        const isFolder = directoryCheck || false;
        const res = await fetch(`${API_BASE_URL}/delete?path=${encodeURIComponent(name)}&isFolder=${isFolder}`, {
            method: 'DELETE'
        })
        const data = await res.json();
        if (res.ok) {
            alert(data.message); // "File deleted successfully!"
            // Optional: Refresh your file list here
            window.location.reload();
        } else {
            alert("Error: " + data.error);
        }
    }

    return (
        <ul className="list bg-base-100 rounded-box shadow-md">
            <li className="list-row flex items-center justify-evenly">
                <div className='w-[10%]'>{index + 1}</div>
                <div className='w-[70%]'>{file.name}</div>
                <div className='w-[20%] text-right'>
                    <button className="btn btn-square btn-ghost">
                        <a href={`${API_BASE_URL}/download?path=${file.name}`} download><IoMdDownload size={20} /></a>
                    </button>
                    <button className="btn btn-square btn-ghost" onClick={() => handleDelete(file.name, file.isDirectory)}>
                        <MdDelete size={20} />
                    </button>
                </div>
            </li>
        </ul>
    );
};

export default List;