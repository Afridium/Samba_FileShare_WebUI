import { API_BASE_URL } from "./APIBaseUrl";

export const handleUpload = async(e, file, currentPath = "") => {
        e.preventDefault();
       
        if(!file) return alert("No files are selected, Please Select a file!");

        const formData = new FormData();
        formData.append('file', file);

        try{
            const res = await fetch(`${API_BASE_URL}/upload?path=${encodeURIComponent(currentPath)}`, {
                method: 'POST',
                body: formData
            })

            const data = await res.json();

            if(res.ok){
                alert(data.message);
                document.getElementById('my_modal_1').close();
                setTimeout(()=>{
                    window.location.reload();
                }, 2000)
                //window.location.reload();
            }else{
                alert("Error while uploading");
            }

        }catch (error) { 
        console.error("Upload failed", error);
        alert("Network error or server is down");
    }

        
    }