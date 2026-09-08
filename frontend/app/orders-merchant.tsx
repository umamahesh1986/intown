import React,{useEffect,useState} from "react";

import {
View,
Text,
Button,
ScrollView,
Alert
} from "react-native";


const API="https://devapi.intownlocal.com";


export default function MerchantOrders(){


const merchantId=101;


const [orders,setOrders]=useState<any[]>([]);



useEffect(()=>{

getOrders();

},[]);





const getOrders=async()=>{


const res=await fetch(

`${API}/IN/merchants/${merchantId}/pickup-orders`

);



const data=await res.json();


console.log(
"MERCHANT ORDERS",
data
);


setOrders(data);


};





const updateOrder=async(
pickup_id:string,
action:string
)=>{


const res=await fetch(

`${API}/IN/merchants/${merchantId}/pickup-orders/${pickup_id}`,

{

method:"PUT",

headers:{

"Content-Type":"application/json"

},


body:JSON.stringify({

action

})

}

);



const data=await res.json();


console.log(
"UPDATE",
data
);


Alert.alert(
"Updated",
action
);


getOrders();


};





return(

<ScrollView
style={{padding:20}}
>


<Text
style={{fontSize:25}}
>
Merchant Orders
</Text>



{
orders.map(order=>(


<View
key={order.pickup_id}
style={{
borderWidth:1,
padding:10,
margin:10
}}
>


<Text>
Status:
{order.status}
</Text>



{
order.items?.map((item:any)=>(

<Text key={item.id}>

{item.productName}

-

{item.quantity}

</Text>

))

}




<Button

title="ACCEPT"

onPress={()=>updateOrder(
order.pickup_id,
"ACCEPT"
)}

/>



<Button

title="REJECT"

onPress={()=>updateOrder(
order.pickup_id,
"REJECT"
)}

/>



<Button

title="PICKUP READY"

onPress={()=>updateOrder(
order.pickup_id,
"PICKUP_READY"
)}

/>



</View>


))

}



</ScrollView>

)

}



