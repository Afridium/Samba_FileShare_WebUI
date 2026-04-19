import React, { useState } from 'react';
import UploadModal from './UploadModal';
//import { API_BASE_URL } from '../APIs/APIBaseUrl';
import { handleUpload } from '../APIs/handleUpload';

const NavBar = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    
    return (
        <div className="navbar bg-base-100 shadow-sm">
            <a className="btn btn-ghost text-xl">SambaWeb</a>
            <a className='btn bg-blue-500 rounded-2xl' onClick={() => document.getElementById('my_modal_1').showModal()}>Upload Files</a>

            <dialog id="my_modal_1" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Upload Files Here</h3>
                    <form onSubmit={(e) => handleUpload(e, selectedFile, "")} className='my-4'>
                        <input 
                            type="file" 
                            className="file-input file-input-bordered file-input-primary w-full" 
                            onChange={(e) => setSelectedFile(e.target.files[0])}
                        />
                        
                        {/* Submit Button */}
                        <div className='flex justify-center mt-2.5'>
                           <button type="submit" className="btn btn-success flex justify-center">
                            Submit Upload
                        </button> 
                        </div>
                        
                    </form>
                    <div className="modal-action">
                        <form method="dialog">
                            {/* if there is a button in form, it will close the modal */}
                            <button className="btn">Close</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </div>
    );
};

export default NavBar;